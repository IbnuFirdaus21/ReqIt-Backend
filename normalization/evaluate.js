import { normalizeMenuRequest, normalizeAllergy } from './pipeline.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const datasetMenu = require('./data/dataset_menu.json');
const datasetAlergi = require('./data/dataset_alergi.json');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const evaluate = (predictions) => {
    let TP = 0, FP = 0, FN = 0, TN = 0;
    const perCategory = {};

    predictions.forEach(({ expected, predicted, expectedNull }) => {
        const exp = expected?.toLowerCase() || null;
        const pred = predicted?.toLowerCase() || null;

        if (exp === null && pred === null) TN++;
        else if (exp === null && pred !== null) FP++;
        else if (exp !== null && pred === null) FN++;
        else if (exp === pred) TP++;
        else { FP++; FN++; }

        const cat = expected || 'NULL';
        if (!perCategory[cat]) perCategory[cat] = { TP: 0, FP: 0, FN: 0, TN: 0 };
        if (exp === null && pred === null) perCategory[cat].TN++;
        else if (exp === null && pred !== null) perCategory[cat].FP++;
        else if (exp !== null && pred === null) perCategory[cat].FN++;
        else if (exp === pred) perCategory[cat].TP++;
        else { perCategory[cat].FP++; perCategory[cat].FN++; }
    });

    const total = TP + FP + FN + TN;
    const accuracy = ((TP + TN) / total * 100).toFixed(2);
    const precision = TP + FP > 0 ? (TP / (TP + FP) * 100).toFixed(2) : '0.00';
    const recall = TP + FN > 0 ? (TP / (TP + FN) * 100).toFixed(2) : '0.00';
    const f1 = precision > 0 && recall > 0
        ? (2 * precision * recall / (parseFloat(precision) + parseFloat(recall))).toFixed(2)
        : '0.00';

    return { accuracy, precision, recall, f1, TP, FP, FN, TN, perCategory };
};

const runEvaluation = async () => {
    console.log('========================================');
    console.log('  EVALUASI PIPELINE — DOMAIN MENU');
    console.log('========================================\n');

    const menuPredictions = [];
    let menuCount = 0;

    for (const item of datasetMenu) {
        menuCount++;
        process.stdout.write(`\r  Memproses ${menuCount}/${datasetMenu.length}: "${item.input}"...`);

        const result = await normalizeMenuRequest(item.input);
        const predicted = result.accepted ? result.normalized : null;
        const expected = item.expected_nama || null;

        menuPredictions.push({
            input: item.input,
            expected,
            predicted,
            stage: result.stage,
            source: result.source,
            confidence: result.confidence,
            reason: result.reason,
            kategori_uji: item.kategori_uji
        });

        await sleep(3000);
    }

    console.log('\n\n--- Hasil Per Test Case ---');
    menuPredictions.forEach(p => {
        const status = p.expected === p.predicted ? '✅' : '❌';
        console.log(`${status} [${p.kategori_uji}] "${p.input}"`);
        console.log(`   Expected : ${p.expected || 'NULL'}`);
        console.log(`   Predicted: ${p.predicted || 'NULL'} (Stage ${p.stage}, conf: ${p.confidence})`);
    });

    const menuMetrics = evaluate(menuPredictions);
    console.log('\n--- Metrik Evaluasi Domain Menu ---');
    console.log(`  Accuracy : ${menuMetrics.accuracy}%`);
    console.log(`  Precision: ${menuMetrics.precision}%`);
    console.log(`  Recall   : ${menuMetrics.recall}%`);
    console.log(`  F1-Score : ${menuMetrics.f1}%`);
    console.log(`  TP: ${menuMetrics.TP} | FP: ${menuMetrics.FP} | FN: ${menuMetrics.FN} | TN: ${menuMetrics.TN}`);

    console.log('\n\n========================================');
    console.log('  EVALUASI PIPELINE — DOMAIN ALERGI');
    console.log('========================================\n');

    const alergiPredictions = [];
    let alergiCount = 0;

    for (const item of datasetAlergi) {
        alergiCount++;
        process.stdout.write(`\r  Memproses ${alergiCount}/${datasetAlergi.length}: "${item.input}"...`);

        const result = await normalizeAllergy(item.input);
        const predicted = result.accepted ? result.normalized : null;
        const expected = item.expected || null;

        alergiPredictions.push({
            input: item.input,
            expected,
            predicted,
            stage: result.stage,
            source: result.source,
            confidence: result.confidence,
            reason: result.reason,
            kategori_uji: item.kategori_uji
        });

        await sleep(3000);
    }

    console.log('\n\n--- Hasil Per Test Case ---');
    alergiPredictions.forEach(p => {
        const status = p.expected === p.predicted ? '✅' : '❌';
        console.log(`${status} [${p.kategori_uji}] "${p.input}"`);
        console.log(`   Expected : ${p.expected || 'NULL'}`);
        console.log(`   Predicted: ${p.predicted || 'NULL'} (Stage ${p.stage}, conf: ${p.confidence})`);
    });

    const alergiMetrics = evaluate(alergiPredictions);
    console.log('\n--- Metrik Evaluasi Domain Alergi ---');
    console.log(`  Accuracy : ${alergiMetrics.accuracy}%`);
    console.log(`  Precision: ${alergiMetrics.precision}%`);
    console.log(`  Recall   : ${alergiMetrics.recall}%`);
    console.log(`  F1-Score : ${alergiMetrics.f1}%`);
    console.log(`  TP: ${alergiMetrics.TP} | FP: ${alergiMetrics.FP} | FN: ${alergiMetrics.FN} | TN: ${alergiMetrics.TN}`);

    console.log('\n========================================');
    console.log('  EVALUASI SELESAI');
    console.log('========================================');
};

runEvaluation();
