import { PrismaClient } from "@prisma/client";
import config from "./config";
import DB from "./db";

const prisma = new PrismaClient();

(async () => {
  try {
    await DB().catch((err) => console.log(err));
    await migrateTimelines();
  } catch (error) {
    console.log(error);
  }
})();

const migrateUserHospital = async () => {
  const oldData: any = await (await DB())
    .collection("userhospitals")
    .find({})
    .toArray();
  try {
    for (let i = 0; i < oldData.length; i++) {
      const data = oldData[i];
    }
  } catch (err) {
    console.log(err);
  }
};

const migrateTimelines = async () => {
  try {
    const count = await (await DB()).collection("timelines").countDocuments();
    for (let i = 0; i < count; i += config.DOCUMENT_PULL_LIMIT) {
      console.log(
        `Getting data from ${i} to ${Math.min(
          i + config.DOCUMENT_PULL_LIMIT,
          count
        )}`
      );
      const oldData: any = await (await DB())
        .collection("timelines")
        .find({})
        .limit(config.DOCUMENT_PULL_LIMIT)
        .skip(i)
        .toArray();
        console.log(
          `Getting data from ${i} to ${Math.min(
            i + config.DOCUMENT_PULL_LIMIT,
            count
          )}`
        );
        for (let i = 0; i < oldData.length; i++) {
          try {
            const d = oldData[i];
            d.id = d._id.toString();
            delete d._id;
            delete d.__v;
            d.doctorId = d.doctorId || "";
            d.labCode = d.labCode || "";
            d.bucketKey = d.bucketKey || "";
            d.farmakoMeta = d.farmakoMeta || "{}";
            d.tags = d.tags || [];
            d.isMigrated = d.isMigrated || true;
            d.isDeleted = d.isDeleted || false;
            d.userID = d.userID.toString() || "";
            d.dd = d.dd.toString() || "";
            d.mm = d.mm.toString() || "";
            d.yyyy = d.yyyy.toString() || "";
            d.updatedByID = d.updatedByID.toString() || "";
            d.title = d.title || "";
            d.type = d.type || "";
            d.dataID = d.dataID.toString() || "";
            d.timelineID = d.timelineID.toString() || "";
            d.entityId = d.entityId || "";
            d.date = new Date(d.date).getTime();
            d.dateUploaded = new Date(d.dateUploaded).getTime();
            if (d.farmakoMeta != "{}" && d.labCode == "") {
              d.labCode = JSON.parse(d.farmakoMeta).labCode;
            }
            await prisma.timelines.create({
              data: d,
            });
            console.log(`✅ : ${d.id} migrated`);
          } catch (error) {
            console.log(error);
          }
        }
    }
  } catch (err) {
    console.log(err);
  }
};

// const oldData: any = await (await DB())
//     .collection("timelines")
//     .find({})
//     .toArray();
//   try {
//     for (let i = 0; i < oldData.length; i++) {
//         try {
//             const d = oldData[i];
//             d.id = d._id.toString();
//             delete d._id;
//             delete d.__v;
//             d.doctorId = d.doctorId || "";
//             d.labCode = d.labCode|| "";
//             d.bucketKey = d.bucketKey || "";
//             d.farmakoMeta = d.farmakoMeta || "{}";
//             d.tags = d.tags || [];
//             d.isMigrated = d.isMigrated || true;
//             d.isDeleted = d.isDeleted || false;
//             d.userID = d.userID.toString() || "";
//             d.dd = d.dd.toString() || "";
//             d.mm = d.mm.toString()|| "";
//             d.yyyy = d.yyyy.toString() || "";
//             d.updatedByID = d.updatedByID.toString() || "";
//             d.title = d.title || "";
//             d.type = d.type || "";
//             d.dataID = d.dataID.toString() || "";
//             d.timelineID = d.timelineID.toString() || "";
//             d.entityId = d.entityId || "";
//             d.date = new Date(d.date).getTime();
//             d.dateUploaded =new Date(d.dateUploaded).getTime();
//             if(d.farmakoMeta != "{}" && d.labCode == ""){
//                 d.labCode  = JSON.parse(d.farmakoMeta).labCode
//             }
//             await prisma.timelines.create({
//               data: d,
//             })
//         } catch (error) {
//             console.log(error)
//         }
//     }
//   } catch (error) {
//     console.log(error);
//   }
