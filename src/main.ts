import axios from "axios";
import cheerio from "cheerio";
import * as fs from "fs";

const fetchMedicines =async() => {
    try {
        console.log("Fetching medicines...");
        const medicines = []
        let id  =0
        for(let i = 97;i<=122;i++){
            console.log("Fetching results starting from "+String.fromCharCode(i)+"...");
            let url = `https://www.1mg.com/drugs-all-medicines?page=1&label=${String.fromCharCode(i)}`;
            const response = await axios.get(url);
            const html = response.data;
            const $ = cheerio.load(html);
            const limit = Math.ceil(parseInt($('div.marginBoth-16.col-6.textSecondary.bodyMedium').text().split(' ')[3])/30)
            for(let j = 1; j<=limit;j++){
                url = `https://www.1mg.com/drugs-all-medicines?page=${j}&label=${String.fromCharCode(i)}`
                console.log("Fetching results from page "+url+"...");
                const response = await axios.get(url);
                const html = response.data;
                const $ = cheerio.load(html);
                $('div.Card__container__liTc5.Card__productCard__SrdLF.Card__direction__H8OmP.container-fluid-padded-xl').each((i,el)=>{
                    const data = $(el);
                    const details = []
                    data.find('p.Card__productDescription__kL6Ho').each((i,el)=>{details.push($(el).text())})
                    const medicine  = {
                        id: id++,
                        medicineName: data.find('p.Card__productName__qw2CE.bodyMedium').text(),
                        prescription: details[0],
                        amount: details[1],
                        manufacturer: details[2],
                        composition: details[3],
                        price: data.find('span.l3Regular').text(),
                    }
                    medicines.push(medicine)
                })
            }
        }
        return medicines
    } catch (err) {
        console.log(err);
        throw err;
    }
}

(async ()=>{
    const medicines = await fetchMedicines();
    fs.writeFileSync('medicines.json',JSON.stringify(medicines))
})()