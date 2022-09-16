import DB from "./db";

(async () => {
    await DB().catch((err) => console.log(err));
    await (await DB()).createIndex("drugs-success", { proprietaryName: 1 },{unique:true})
    await (await DB()).createIndex("drugs-failed", { proprietaryName: 1 }, {unique:true})
})();
