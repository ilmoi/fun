import axios from "axios";
import {createWriteStream} from "fs";
import {backOff} from "exponential-backoff";

const fs = require('fs');

//change this!
const BATCH_SIZE = 50;

//in case crashes, can manually enter
const START_FROM_DEGODS = 0;
const START_FROM_Y00TS = 0;

(async () => {
  const f: any[] = require('./degods_y00ts.json');
  const degods = f.filter(i => i.name.includes('DeGod')).slice(START_FROM_DEGODS)
  const y00ts = f.filter(i => i.name.includes('y00t')).slice(START_FROM_Y00TS);
  console.log('degods total to do:', degods.length);
  console.log('y00ts total to do:', y00ts.length);

  // --------------------------------------- degods

  let batchCounter = 0;
  let totalBatches = Math.round(degods.length / BATCH_SIZE);

  console.log('begin degods')
  while (degods.length > 0) {
    const nextBatch = degods.splice(0, BATCH_SIZE);
    await Promise.all(nextBatch.map(async (f, i) => {
      const {data: meta} = await backOff(() => axios.get(f.metadataUri));
      const degodCounter = batchCounter * BATCH_SIZE + i;
      const out = {
        "name": `DeGone #${degodCounter + 1}`,
        "symbol": "DGONE",
        "description": "A collection of 10,000 of the most degenerate goners of the Solana ecosystem.",
        "image": `${degodCounter}.png`,
        "attributes": meta.attributes,
        "properties": {
          "files": [
            {
              "uri": `${degodCounter}.png`,
              "type": "image/png"
            }
          ]
        }
      }
      fs.writeFileSync(`out/degods/${degodCounter}.json`, JSON.stringify(out));
      await backOff(() => downloadFile(meta.image, `out/degods/${degodCounter}.png`));
    }))

    batchCounter++;
    console.log(`> done degods batch ${batchCounter}/${totalBatches}`)
  }

  console.log('✅ degods done')

  // --------------------------------------- y00ts

  batchCounter = 0;
  totalBatches = Math.round(y00ts.length / BATCH_SIZE);

  console.log('begin y00ts')
  while (y00ts.length > 0) {
    const nextBatch = y00ts.splice(0, BATCH_SIZE);
    await Promise.all(nextBatch.map(async (f, i) => {
      const {data: meta} = await backOff(() => axios.get(f.metadataUri));
      const y00tCounter = batchCounter * BATCH_SIZE + i;
      const out = {
        "name": `y00later #${y00tCounter + 1}`,
        "symbol": "Y00LATER",
        "description": "y00later is a curated community of builders and creators who stick to their grounds and make the best out of it. Each community member has the power to shape its future.",
        "image": `${y00tCounter}.png`,
        "attributes": meta.attributes,
        "properties": {
          "files": [
            {
              "uri": `${y00tCounter}.png`,
              "type": "image/png"
            }
          ]
        }
      }
      fs.writeFileSync(`out/y00ts/${y00tCounter}.json`, JSON.stringify(out))
      await backOff(() => downloadFile(meta.image, `out/y00ts/${y00tCounter}.png`));
    }))

    batchCounter++;
    console.log(`> done y00ts batch ${batchCounter}/${totalBatches}`)
  }

  console.log('✅ y00ts done')
})()

export async function downloadFile(fileUrl: string, outputLocationPath: string) {
  const writer = createWriteStream(outputLocationPath);

  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then(response => {

    //ensure that the user can call `then()` only when the file has
    //been downloaded entirely.

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error: any = null;
      writer.on('error', err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) {
          resolve(true);
        }
        //no need to call the reject here, as it will have been called in the
        //'error' stream;
      });
    });
  });
}
