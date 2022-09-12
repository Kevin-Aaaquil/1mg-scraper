import axios from "axios";
import cheerio from "cheerio";
import * as fs from "fs";

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
    const medData = {
      drugs: [],
      otc: [],
      generics: [],
    };
    let links = await renderDrugs(data.drugs, 1);
    medData.drugs = links;
    links = await renderOtc(data.otc, medData.drugs.length + 1);
    medData.otc = links;
    // links = await renderGenerics(data.genrics, medData.otc.length + 1);
    // medData.push(...links);
    console.log("COMPLETE");
    return medData;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const renderDrugs = async (links: string[], id): Promise<string[]> => {
  try {
    const res = [];
    console.log("SCRAPING DRUGS...");
    for (let i = 0; i < links.length; i++) {
      try {
        //Change to links.length
        const url = links[i];
        console.log(`Fetching page ${url}...`);
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        const jsonData = [];
        $('script[type="application/ld+json"]').each((i, el) => {
          const data = $(el);
          const json = JSON.parse(data.html());
          jsonData.push(json);
        });
        const final = jsonData.find((item) => item.proprietaryName != null);
        const data = {
          id: id++,
          ...final,
        };
        res.push(data);
        if (id % 500 == 0) {
          setTimeout(function () {
            console.log("Sleeping for 1 second");
          }, 1000);
        }
      } catch (error) {
        throw error;
      }
    }
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const renderOtc = async (links, id): Promise<string[]> => {
  try {
    const res = [];
    console.log("SCRAPING OTC...");
    for (let i = 0; i < links.length; i++) {
      //Change to links.length
      try {
        const url = links[i];
        console.log(`Fetching page ${url}...`);
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        const jsonData = [];
        $('script[type="application/ld+json"]').each((i, el) => {
          const data = $(el);
          const json = JSON.parse(data.html());
          jsonData.push(json);
        });
        const final = jsonData.find((item) => item.manufacturer != null);
        // console.log(final,"Length : "+jsonData.length);
        const data = {
          id: id++,
          ...final,
        };
        res.push(data);
        if (id % 500 == 0) {
          setTimeout(function () {
            console.log("Sleeping for 1 second");
          }, 1000);
        }
      } catch (error) {
        throw error;
      }
    }
    return res;
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
  const xmlLinksJson = await fetchXmlLinks();
  fs.writeFileSync("./dataFiles/xmlLinks.json", JSON.stringify(xmlLinksJson));
  const allLinks = await getLinksfromXml(xmlLinksJson);
  fs.writeFileSync("./dataFiles/allLinks.json", JSON.stringify(allLinks));
  const medData = await renderData(allLinks);
  fs.writeFileSync("./dataFiles/medData.json", JSON.stringify(medData));
})();
