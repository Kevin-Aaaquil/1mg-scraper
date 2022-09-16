import DB from "./db";

(async () => {
    await DB().catch((err) => console.log(err));

    await (await DB()).collection('drugs-success').deleteMany({});
    await (await DB()).collection('drugs-failed').deleteMany({});
    await (await DB()).collection('otc-success').deleteMany({});
    await (await DB()).collection('otc-failed').deleteMany({});
    await (await DB()).collection('generics-success').deleteMany({});
    await (await DB()).collection('generics-failed').deleteMany({});
})();
