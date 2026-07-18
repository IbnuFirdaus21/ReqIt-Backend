import express from 'express';
import mysql from 'mysql';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { normalizeMenuRequest } from './normalization/pipeline.js';
import { normalizeAllergy } from './normalization/pipeline.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Folder untuk menyimpan gambar
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Serve static files from uploads folder
app.use('/uploads', express.static('uploads'));

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mbg_db'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database!');
});

// Routes
// Register
app.post('/api/auth/register', async (req, res) => {
    const { email, nis, password, hasAllergy, allergiesDetails } = req.body;

    try {
        // Check if NIS exists in students_data
        const checkNisQuery = 'SELECT * FROM students_data WHERE nis = ?';
        db.query(checkNisQuery, [nis], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            if (results.length === 0) {
                return res.status(400).json({ error: 'NIS tidak ditemukan di database sekolah' });
            }

            // Check if user already exists
            const checkUserQuery = 'SELECT * FROM users WHERE email = ? OR nis = ?';
            db.query(checkUserQuery, [email, nis], async (err, results) => {
                if (err) return res.status(500).json({ error: 'Database error' });

                if (results.length > 0) {
                    return res.status(400).json({ error: 'Email atau NIS sudah terdaftar' });
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Normalisasi data alergi jika ada
                let normalizedAllergies = allergiesDetails || '';
                if (hasAllergy && allergiesDetails) {
                    const allergyInputs = allergiesDetails.split(',').map(a => a.trim()).filter(a => a);
                    const normalizedResults = await Promise.all(
                        allergyInputs.map(a => normalizeAllergy(a))
                    );
                    const accepted = normalizedResults
                        .filter(r => r.accepted)
                        .map(r => r.normalized);
                    const rejected = normalizedResults
                        .filter(r => !r.accepted)
                        .map((r, i) => allergyInputs[i]);

                    normalizedAllergies = accepted.length > 0
                        ? accepted.join(', ')
                        : allergiesDetails;

                    console.log('Alergi dinormalisasi:', { accepted, rejected });
                }

                const insertQuery = 'INSERT INTO users (email, nis, password, has_allergy, allergies_details) VALUES (?, ?, ?, ?, ?)';
                db.query(insertQuery, [email, nis, hashedPassword, hasAllergy || false, normalizedAllergies], (err, result) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    res.status(201).json({ message: 'User registered successfully' });
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (results.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    });
});

// Get Menus
app.get('/api/menus', (req, res) => {
    // Tabel menus: id, Food, description, image, created_at
    // Alias Food sebagai name agar konsisten dengan frontend
    const query = 'SELECT id, Food AS name, description, image, created_at FROM menus ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Get Today's Menu
app.get('/api/menus/today', (req, res) => {
    const query = 'SELECT id, Food AS name, description, image, created_at FROM menus WHERE DATE(created_at) = CURDATE() ORDER BY created_at DESC LIMIT 1';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.json(null); // Tidak ada menu hari ini
        }
    });
});

// Add Menu (Admin only) with image upload
app.post('/api/menus', upload.single('image'), (req, res) => {
    const { name, description } = req.body; // dikirim dari frontend sebagai "name"
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    // Cek apakah sudah ada menu hari ini
    const checkQuery = 'SELECT * FROM menus WHERE DATE(created_at) = CURDATE()';
    db.query(checkQuery, (err, results) => {
        if (err) {
            console.error('Check query error:', err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        if (results.length > 0) {
            // Update menu hari ini - gunakan kolom Food, bukan name
            const updateQuery = 'UPDATE menus SET Food = ?, description = ?, image = ? WHERE DATE(created_at) = CURDATE()';
            db.query(updateQuery, [name, description, image], (err, result) => {
                if (err) {
                    console.error('Update query error:', err);
                    return res.status(500).json({ error: 'Database error: ' + err.message });
                }
                res.status(200).json({ message: 'Menu updated successfully' });
            });
        } else {
            // Insert menu baru - gunakan kolom Food, bukan name
            const insertQuery = 'INSERT INTO menus (Food, description, image) VALUES (?, ?, ?)';
            db.query(insertQuery, [name, description, image], (err, result) => {
                if (err) {
                    console.error('Insert query error:', err);
                    return res.status(500).json({ error: 'Database error: ' + err.message });
                }
                res.status(201).json({ message: 'Menu added successfully' });
            });
        }
    });
});

// Get Requests
app.get('/api/requests', (req, res) => {
    const query = 'SELECT r.*, u.email FROM requests r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Add Request
app.post('/api/requests', async (req, res) => {
    const { userId, menuName } = req.body;

    if (!userId || !menuName) {
        return res.status(400).json({ error: 'User ID dan nama menu wajib diisi' });
    }

    // Jalankan 4-stage normalization pipeline
    const normalized = await normalizeMenuRequest(menuName);

    // Jika pipeline menolak input
    if (!normalized.accepted) {
        const messages = {
            REJECTED_PROFANITY: 'Input mengandung kata tidak pantas. Mohon gunakan bahasa yang sopan.',
            REJECTED_TOO_SHORT: 'Input terlalu pendek. Mohon tulis nama menu yang lebih lengkap.',
            REJECTED_UNRECOGNIZED: 'Menu tidak dikenali. Mohon tulis nama menu yang tersedia.'
        };
        return res.status(400).json({
            error: messages[normalized.reason] || 'Input tidak valid.',
            reason: normalized.reason,
            cleanedInput: normalized.cleanedInput
        });
    }

    // Cek apakah user sudah request hari ini
    const checkQuery = 'SELECT * FROM requests WHERE user_id = ? AND DATE(created_at) = CURDATE()';
    db.query(checkQuery, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (results.length > 0) {
            return res.status(400).json({
                error: 'Anda sudah mengirim request hari ini. Coba lagi besok.'
            });
        }

        // Simpan hasil normalisasi ke database
        const query = 'INSERT INTO requests (user_id, menu_name) VALUES (?, ?)';
        db.query(query, [userId, normalized.normalized], (err, result) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(201).json({
                message: 'Request berhasil dikirim!',
                original: menuName,
                normalized: normalized.normalized,
                menuId: normalized.menuId,
                confidence: normalized.confidence,
                stage: normalized.stage
            });
        });
    });
});

// Get Ratings
app.get('/api/ratings', (req, res) => {
    // Sesuaikan dengan kolom Food di tabel menus
    const query = `
        SELECT r.*, u.email, m.Food AS menu_name
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        JOIN menus m ON r.menu_id = m.id
        ORDER BY r.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Add Rating
app.post('/api/ratings', (req, res) => {
    let { userId, menuId, rating, comment } = req.body;

    // Basic required-field validation
    if (!userId || rating === undefined || rating === null) {
        return res.status(400).json({ error: 'User ID dan rating wajib diisi' });
    }

    const numericRating = parseInt(rating, 10);
    if (Number.isNaN(numericRating)) {
        return res.status(400).json({ error: 'Rating harus berupa angka' });
    }

    if (numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ error: 'Rating harus antara 1 sampai 5 bintang' });
    }

    // Jika rating <= 3, komentar/alasan wajib diisi
    const trimmedComment = (comment || '').trim();
    if (numericRating <= 3 && !trimmedComment) {
        return res.status(400).json({
            error: 'Untuk rating 3 ke bawah, mohon tuliskan alasan pada kolom umpan balik'
        });
    }

    const insertQuery = 'INSERT INTO ratings (user_id, menu_id, rating, comment) VALUES (?, ?, ?, ?)';
    db.query(insertQuery, [userId, menuId, numericRating, trimmedComment], (err, result) => {
        if (err) {
            console.error('Insert rating error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Rating submitted successfully' });
    });
});

// Get Feedbacks
app.get('/api/feedbacks', (req, res) => {
    const query = 'SELECT f.*, u.email FROM feedbacks f JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Add Feedback
app.post('/api/feedbacks', (req, res) => {
    const { userId, message } = req.body;
    const query = 'INSERT INTO feedbacks (user_id, message) VALUES (?, ?)';
    db.query(query, [userId, message], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(201).json({ message: 'Feedback submitted successfully' });
    });
});

// Get Requests Summary for Chart
app.get('/api/requests/summary', (req, res) => {
    const query = 'SELECT menu_name, COUNT(*) as total FROM requests GROUP BY menu_name ORDER BY total DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        // Normalisasi nama makanan
        const normalizedData = results.map(row => ({
            food: normalizeFoodName(row.menu_name),
            total: row.total
        }));

        // Gabungkan yang sama setelah normalisasi
        const mergedData = {};
        normalizedData.forEach(item => {
            if (mergedData[item.food]) {
                mergedData[item.food] += item.total;
            } else {
                mergedData[item.food] = item.total;
            }
        });

        const finalData = Object.keys(mergedData).map(food => ({
            food,
            total: mergedData[food]
        })).sort((a, b) => b.total - a.total);

        res.json(finalData);
    });
});

// Get Allergies Summary
app.get ('/api/allergies/summary', (req, res) => {
    const query = `
        SELECT 
            u.nis, 
            u.email,
            u.allergies_details,
            s.full_name,
            s.class
        FROM users u
        LEFT JOIN students_data s ON u.nis = s.nis
        WHERE u.has_allergy = 1 AND u.role = 'user'
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        const totalAllergyStudents = results.length;

        // Process allergies
        const allergyStats = {};
        const allergyUsers = [];

        results.forEach(row => {
            const allergies = parseAllergies(row.allergies_details);
            allergies.forEach(allergy => {
                const normalized = normalizeAllergy(allergy);
                if (normalized) {
                    if (allergyStats[normalized]) {
                        allergyStats[normalized]++;
                    } else {
                        allergyStats[normalized] = 1;
                    }
                }
            });
            allergyUsers.push({
                nis: row.nis,
                full_name: row.full_name || '-',
                class: row.class || '-',
                email: row.email,
                allergies_details: row.allergies_details
            });
        });

        const allergyStatsArray = Object.keys(allergyStats).map(allergy => ({
            allergy,
            total: allergyStats[allergy]
        })).sort((a, b) => b.total - a.total);

        res.json({
            totalAllergyStudents,
            allergyStats: allergyStatsArray,
            allergyUsers
        });
    });
});

// Fungsi parse allergies_details (teks bebas)
function parseAllergies(details) {
    if (!details) return [];
    return details.split(/[,;]/).map(item => item.trim().toLowerCase()).filter(item => item.length > 0);
}

// Fungsi normalisasi nama makanan
function normalizeFoodName(name) {
    if (!name) return 'unknown';

    let normalized = name.toLowerCase().trim();

    // Hapus karakter khusus dan angka
    normalized = normalized.replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ');

    // Mapping variasi umum
    const mappings = {
        'mi ayam': 'mie ayam',
        'mieayam': 'mie ayam',
        'mie ayam pake bakso': 'mie ayam',
        'mie ayam bakso': 'mie ayam',
        'nasi goreng': 'nasi goreng',
        'nasigoreng': 'nasi goreng',
        'nasi goreng spesial': 'nasi goreng',
        'ayam goreng': 'ayam goreng',
        'ayamgoreng': 'ayam goreng',
        'ayam geprek': 'ayam geprek',
        'ayamgeprek': 'ayam geprek',
        'nasi kuning': 'nasi kuning',
        'nasikuning': 'nasi kuning',
        'udang': 'udang',
        'ayam teriyaki': 'ayam teriyaki',
        'ayamteriyaki': 'ayam teriyaki',
        'nasi karage': 'nasi karage',
        'nasikarage': 'nasi karage'
    };

    return mappings[normalized] || normalized;
}

app.post('/api/chatbot', async (req, res) => {
    const { userInput } = req.body;

    if (!userInput) {
        return res.status(400).json({ error: 'User input is required' });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-3-ultra-550b-a55b:free",
                messages: [
                    {
                        role: "system",
                        content: "Kamu adalah chatbot resmi website ReqIT untuk Program Makan Bergizi Gratis (MBG). Peran utamamu adalah membantu siswa memahami kandungan gizi dari menu MBG hari ini. Tugasmu adalah menjelaskan kandungan gizi makanan secara sederhana (seperti karbohidrat, protein, sayur, dan vitamin), memberikan edukasi singkat tentang manfaat gizi menu bagi kesehatan dan konsentrasi belajar, serta menjawab pertanyaan siswa seputar makanan dan nutrisi dalam konteks MBG. Jawaban harus singkat, jelas, ramah, dan hanya fokus pada topik menu MBG serta kandungan gizi makanan. Jangan memberikan diagnosis atau saran medis khusus. Jika pertanyaan di luar topik makanan dan gizi, arahkan pengguna kembali ke pembahasan MBG. Selalu gunakan Bahasa Indonesia."
                    },
                    {
                        role: "user",
                        content: userInput
                    }
                ]
            })
        });

        const data = await response.json();
        const botReply = data.choices?.[0]?.message?.content || "Maaf, tidak ada respon dari AI.";
        res.json({ reply: botReply });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Terjadi kesalahan saat mengambil data dari AI." });
    }
});

app.listen(8800, () => {
    console.log("Backend is running on port 8800!");
});