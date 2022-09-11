import axios from "axios";
import cheerio from "cheerio";
import * as fs from "fs";

const fetchXmlLinks = async () => {
  try {
    const links = [];
    const url = "https://www.1mg.com/sitemap.xml";
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
    // const medData = [];
    let links = await renderDrugs(data.drugs, 1);
    // medData.push(...links);
    links = await renderOtc(data.otc, data.drugs.length+1);
    // medData.push(...links);
    links = await renderGenerics(data.genrics, data.otc.length+1);
    // medData.push(...links);
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const renderDrugs = async (links: string[], id): Promise<string[]> => {
  const res = [];
  // for (let i = 0; i < 10; i++) {                        //Change to links.length
  const url = links[0];
  console.log(`Fetching page ${url}...`);
  const response = await axios.get(url);
  const html = response.data;
  // const $ = cheerio.load(html);
  fs.writeFileSync("drug.html", html);
  //     const data = {
  //         id: id,
  //     }
  //     res.push(data)
  // }
  return res;
};
const renderOtc = async (links, id): Promise<string[]> => {
  const res = [];
  // for (let i = 0; i < 10; i++) {                        //Change to links.length
  const url = links[0];
  console.log(`Fetching page ${url}...`);
  const response = await axios.get(url);
  const html = response.data;
  // const $ = cheerio.load(html);
  fs.writeFileSync("drug.html", html);
  //     const data = {
  //         id: id,
  //     }
  //     res.push(data)
  // }
  return res;
};
const renderGenerics = async (links, id): Promise<string[]> => {
  const res = [];
  // for (let i = 0; i < 10; i++) {                        //Change to links.length
  const url = links[0];
  console.log(`Fetching page ${url}...`);
  const response = await axios.get(url);
  const html = response.data;
  // const $ = cheerio.load(html);
  fs.writeFileSync("drug.html", html);
  //     const data = {
  //         id: id,
  //     }
  //     res.push(data)
  // }
  return res;
};

(async () => {
  const xmlLinksJson = await fetchXmlLinks();
  fs.writeFileSync("xmlLinks.json", JSON.stringify(xmlLinksJson));
  const allLinks = await getLinksfromXml(xmlLinksJson);
  fs.writeFileSync("allLinks.json", JSON.stringify(allLinks));
    await renderData(allLinks);
})();