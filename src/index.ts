import axios from "axios";
import cheerio from "cheerio";
import * as fs from "fs";

const fetchListOfSalts = async () => {
  try {
    console.log("Fetching list of salts...");
    const salts = [];
    let id = 1;
    for (let i = 1; i <= 5; i++) {
      const url = "https://www.1mg.com/drug-ailments/---248?pageNumber=" + i;
      console.log("Fetching page " + url);
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      $("div.ListPage__breakWord__qF_cj.col-3.marginTop-8").each((i, el) => {
        const salt = $(el);
        const saltName = salt.find("a").text();
        const saltUrl = "https://www.1mg.com" + salt.find("a").attr("href");
        salts.push({ id, saltName, saltUrl });
        id++;
      });
    }
    return salts;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const fetchSaltMedicines = async (salts) => {
  try {
    const saltMedicines = [];
    let id = 1;
    for (let i = 0; i < salts.length; i++) {
      const salt = salts[i];
      const url = salt.saltUrl;
      console.log("Fetching page " + url);
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);
      $("a.noAnchorColor").each((i, el) => {
        const data = $(el);
        const medicine = {
          id: id++,
          saltName: salt.saltName,
          medicineName: data.find("div.bodySemiBold").text(),
          manufacturer: data
            .find("div.smallRegular.SingleAttributeComparison__subtitle__TRmce")
            .text(),
          priceRange: data.find("div.bodyRegular").text(),
          variants: data.find("div.smallSemiBold").text(),
          url: "https://www.1mg.com" + data.attr("href"),
        };
        saltMedicines.push(medicine);
      });
    }
    return saltMedicines;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const fetchMedicineVariants = async (saltMedicines) => {
  try {
    const variantMedicines = [];
    let id =0;
    for (let i = 0; i < saltMedicines.length; i++) {
        const saltMedicine = saltMedicines[i];
        const url = saltMedicine.url;
        console.log("Fetching page " + url);
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        $('a.noAnchorColor').each((i, el) => {
            const data = $(el);
            const variant = {
                id: id++,
                saltName: saltMedicine.saltName,
                medicineName: saltMedicine.medicineName,
                manufacturer: saltMedicine.manufacturer,
                variantName: data.find('div.bodySemiBold.textPrimary.marginTop-4.HorizontalProductTile__header__vAQQE').text(),
                amount: data.find('div.smallRegular.textSecondary').text(),
                price: data.find('span.l4Medium').text()
            }
            variantMedicines.push(variant);
        })
    } 
    return variantMedicines;  
  } catch (error) {
    console.log(error);
    throw error;
  }
};

(async () => {
  const salts = await fetchListOfSalts();
  fs.writeFileSync(".dataFiles/salts.json", JSON.stringify(salts));
  const saltMedicines = await fetchSaltMedicines(salts);
  fs.writeFileSync(".dataFiles/saltMedicines.json", JSON.stringify(saltMedicines));
  const variantMedicines = await fetchMedicineVariants(saltMedicines);
  fs.writeFileSync(".dataFiles/variantMedicines.json", JSON.stringify(variantMedicines));
  // await fetchSaltMedicines()
})();
