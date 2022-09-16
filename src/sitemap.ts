import axios from "axios";
import cheerio from "cheerio";
import * as fs from "fs";
import Bottleneck from "bottleneck";

import DB from "./db";

const limiter = new Bottleneck({
  maxConcurrent: 10,
  minTime: 100,
});
// const FeedDataToMedData = async (success, failed, key) => {
//   if (
//     !fs.existsSync("./dataFiles/medData.json") &&
//     !fs.existsSync("./dataFiles/failed.json")
//   ) {
//     const medData = {
//       drugs: [],
//       otc: [],
//       generics: [],
//     };
//     const failedData = {
//       drugs: [],
//       otc: [],
//       generics: [],
//     };
//     medData[key] = success;
//     failedData[key] = failed;
//     fs.writeFileSync("./dataFiles/medData.json", JSON.stringify(medData));
//     fs.writeFileSync("./dataFiles/failed.json", JSON.stringify(failedData));
//   } else {
//     let rawData = fs.readFileSync("./dataFiles/medData.json");
//     const medData = JSON.parse(rawData.toString());
//     rawData = fs.readFileSync("./dataFiles/failed.json");
//     const failedData = JSON.parse(rawData.toString());
//     medData[key].push(...success);
//     failedData[key].push(...failed);
//     fs.writeFileSync("./dataFiles/medData.json", JSON.stringify(medData));
//     fs.writeFileSync("./dataFiles/failed.json", JSON.stringify(failedData));
//   }
// };

const fetchXmlLinks = async () => {
  try {
    const links = [];
    const url = "https://www.1mg.com/sitemap.xml";
    console.log(`Fetching page ${url}...`);
    const response = await axios.get(url);
    const xml = response.data;
    // fs.writeFileSync("sitemap.xml", xml);
    const $ = cheerio.load(xml, { xmlMode: true });
    $("loc").each((i, el) => {
      const data = $(el);
      const link = data.text();
      if (link.split("_").indexOf("hi") == -1) {
        links.push(link);
      }
    });
    links.splice(links.length - 4);
    const data = {
      drugs: [],
      otc: [],
      genrics: [],
    };
    for (let i = 0; i < links.length; i++) {
      if (links[i].split("_").indexOf("drugs") != -1) data.drugs.push(links[i]);
      else if (links[i].split("_").indexOf("otc") != -1)
        data.otc.push(links[i]);
      else if (links[i].split("_").indexOf("generics") != -1)
        data.genrics.push(links[i]);
    }
    return data;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const getLinksfromXml = async (data) => {
  try {
    const keys = Object.keys(data);
    const res: any = {};
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j];
      const arr = data[key];
      const links = [];
      for (let i = 0; i < arr.length; i++) {
        const url = arr[i];
        console.log(`Fetching page ${url}...`);
        const response = await axios.get(url);
        const xml = response.data;
        const $ = cheerio.load(xml, { xmlMode: true });
        $("loc").each((i, el) => {
          const data = $(el);
          const link = data.text();
          links.push(link);
        });
      }
      res[key] = links;
    }
    console.log(
      `Drugs: ${res.drugs.length} : Otc: ${res.otc.length} : Generics: ${
        res.genrics.length
      } Total: ${res.drugs.length + res.otc.length + res.genrics.length}`
    );
    return res;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const renderData = async (data) => {
  try {
    const success = {
      drugs: 0,
      otc: 0,
      generics: 0,
    };
    const failed = {
      drugs: 0,
      otc: 0,
      generics: 0,
    };
    let body;
    body = await renderDrugs(data.drugs, 1);
    success.drugs = body.successCount;
    failed.drugs = body.failedCount;
    // FeedDataToMedData(body.success, body.failed, "drugs");
    // body = await renderOtc(data.otc, success.drugs + 1);
    // medData.otc = body.success;
    // failed.otc = body.failed;
    // FeedDataToMedData(body.success, body.failed, "otc");
    // body = await renderGenerics(data.genrics, medData.otc.length + 1);
    // medData.generics = body.success;
    // failed.generics = body.failed;
    // FeedDataToMedData(body.success, body.failed, "generics");
    console.log("COMPLETE");
    console.log({
      success,
      failed,
    });
    // return { medData, failed };
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const renderDrugs = async (links: string[], id) => {
  try {
    // const res = [];
    let successCount = 0,
      failedCount = 0;
    console.log("SCRAPING DRUGS...");
    for (let i = 154490; i < links.length; i += 100) {
      const res = [];
      const limit = Math.min(i + 100, links.length + 1);
      const arr = links.slice(i, limit);
      console.log("SCRAPING BATCH", i, limit);
      const data = await limiter.schedule(async () => {
        const tasks = arr.map(async (url, i) => {
          const response = await axios.get(url);
          console.log(`Fetching page ${url}...`);
          const html = response.data;
          const $ = cheerio.load(html);
          const jsonData = [];
          $('script[type="application/ld+json"]').each((i, el) => {
            const data = $(el);
            const json = JSON.parse(data.html());
            jsonData.push(json);
          });
          const final = jsonData.find((item) => item.proprietaryName != null);
          return final;
        });
        return await Promise.allSettled(tasks);
      });
      res.push(...data);
      const failed = res.filter((item) => item.status == "rejected");
      const success = res.filter((item) => item.status == "fulfilled");
      success.forEach((item: any, i) => {
        success[i] = {
          id: id++,
          ...item.value,
        };
      });
      successCount += success.length;
      failedCount += failed.length;
      // FeedDataToMedData(success, failed, "drugs");
      console.log(success.length, failed.length);
      if (success.length != 0) {
        //   await (await DB())
        //     .collection("drugs-success")
        //     .insertMany(success, { ordered: false });

        const toInsert = success.map((item) => ({
          insertOne: { ...item },
        }));
        await (await DB()).collection("drugs-success").bulkWrite(toInsert, {
          ordered: false,
        });
      }
      if (failed.length != 0) {
        //   await (await DB())
        //     .collection("drugs-failed")
        //     .insertMany(failed, { ordered: false });
        const toInsert = failed.map((item) => ({
          insertOne: { ...item },
        }));
        await (await DB()).collection("drugs-failed").bulkWrite(toInsert, {
          ordered: false,
        });
      }
    }

    return { successCount, failedCount };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const renderOtc = async (links, id) => {
  try {
    const res = [];
    console.log("SCRAPING OTC...");
    for (let i = 0; i < 100; i += 10) {
      const limit = Math.min(i + 10, links.length + 1);
      const arr = links.slice(i, limit);
      console.log("SCRAPING BATCH", i, limit);
      const data = await limiter.schedule(async () => {
        const tasks = arr.map(async (url, i) => {
          const response = await axios.get(url);
          console.log(`Fetching page ${url}...`);
          const html = response.data;
          const $ = cheerio.load(html);
          const jsonData = [];
          $('script[type="application/ld+json"]').each((i, el) => {
            const data = $(el);
            const json = JSON.parse(data.html());
            jsonData.push(json);
          });
          const final = jsonData.find((item) => item.manufacturer != null);
          return final;
        });
        return await Promise.allSettled(tasks);
      });
      res.push(...data);
    }
    const failed = res.filter((item) => item.status == "rejected");
    const success = res.filter((item) => item.status == "fulfilled");
    success.forEach((item: any, i) => {
      res[i] = {
        id: id++,
        ...item.value,
      };
    });
    return { success, failed };
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const renderGenerics = async (links, id): Promise<string[]> => {
  const res = [];
  for (let i = 0; i < 10; i++) {
    //Change to links.length
    const url = links[i];
    console.log(`Fetching page ${url}...`);
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const data = {
      id: id,
    };
    res.push(data);
  }
  return res;
};

(async () => {
  try {
    console.log("Starting fresh run...");
    // Delete all data before fresh run
    if (fs.existsSync("./dataFiles/xmlLinks.json")) {
      await fs.unlinkSync("./dataFiles/xmlLinks.json");
    }
    if (fs.existsSync("./dataFiles/allLinks.json")) {
      await fs.unlinkSync("./dataFiles/allLinks.json");
    }
    // if (fs.existsSync("./dataFiles/medData.json")) {
    //   await fs.unlinkSync("./dataFiles/medData.json");
    // }
    // if (fs.existsSync("./dataFiles/failed.json")) {
    //   await fs.unlinkSync("./dataFiles/failed.json");
    // }
    await DB().catch((err) => console.log(err));
    // const data = await (await DB()).createIndex("drugs-success", { proprietaryName: 1 },{unique:true});
    // const awa = await (await DB()).createIndex("drugs-failed", { proprietaryName: 1 }, {unique:true});

    // Get all XML Links
    const xmlLinksJson = await fetchXmlLinks();
    fs.writeFileSync("./dataFiles/xmlLinks.json", JSON.stringify(xmlLinksJson));

    // Get all data links from XML files
    const allLinks = await getLinksfromXml(xmlLinksJson);
    fs.writeFileSync("./dataFiles/allLinks.json", JSON.stringify(allLinks));

    // Generate all MedData and store it
    await renderData(allLinks);
    // fs.writeFileSync(
    //   "./dataFiles/medData.json",
    //   JSON.stringify(medData.medData)
    // );
    // fs.writeFileSync("./dataFiles/failed.json", JSON.stringify(medData.failed));
  } catch (error) {}
})();
