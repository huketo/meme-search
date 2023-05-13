import weaviete from "weaviate-ts-client";
import { readdirSync, readFileSync, writeFileSync } from "fs";

// Create a client that will connect to Weaviate via HTTP
// and use the default token (which is empty)
const client = weaviete.client({
  scheme: "http",
  host: "localhost:8080",
});

// Get the schema of Weaviate
const schemaRes = await client.schema.getter().do();

// Print the schema
console.log("> Schema:");
console.log(schemaRes);

// Create the schema configuration that we want to add to Weaviate
const schemaConfig = {
  class: "Meme",
  vectorizer: "img2vec-neural",
  vectorIndexType: "hnsw",
  moduleConfig: {
    "img2vec-neural": {
      imageFields: ["image"],
    },
  },
  properties: [
    {
      name: "image",
      dataType: ["blob"],
    },
    {
      name: "text",
      dataType: ["string"],
    },
  ],
};

// Add the schema to Weaviate
// schema class is empty then create schema
if (!schemaRes.classes.length) {
  console.log("> schema is empty, creating schema");
  await client.schema.classCreator().withClass(schemaConfig).do();
}

// If weaviate has data then adding data
const data = await client.data.getter().withClassName("Meme").do();
if (data.totalResults) {
  console.log("> data is not empty, skipping data addition");
} else {
  console.log("> data is empty, adding data");
  addDatas();
}

async function addDatas() {
  const imgFiles = readdirSync("./img");
  const promises = imgFiles.map(async (imgFile) => {
    const img = readFileSync(`./img/${imgFile}`);
    const b64 = Buffer.from(img).toString("base64");

    await client.data
      .creator()
      .withClassName("Meme")
      .withProperties({
        image: b64,
        text: imgFile.split(".")[0].split("_").join(" "),
      })
      .do();
  });

  await Promise.all(promises);
}

// Search for the image that is most similar to the test image
// Test 01
const test01 = Buffer.from(readFileSync("./test/test_01.jpg")).toString(
  "base64"
);

console.log("> searching for test_01 image");

const resImage01 = await client.graphql
  .get()
  .withClassName("Meme")
  .withFields(["image"])
  .withNearImage({ image: test01 })
  .withLimit(1)
  .do();

// Write the result to a file
const result01 = resImage01.data.Get.Meme[0].image;

console.log("> writing result_01 to file");
writeFileSync("./test/result_01.jpg", result01, "base64");

// Test 02
const test02 = Buffer.from(readFileSync("./test/test_02.jpg")).toString(
  "base64"
);

console.log("> searching for test_02 image");

const resImage02 = await client.graphql
  .get()
  .withClassName("Meme")
  .withFields(["image"])
  .withNearImage({ image: test02 })
  .withLimit(1)
  .do();

// Write the result to a file
const result02 = resImage02.data.Get.Meme[0].image;

console.log("> writing result_02 to file");
writeFileSync("./test/result_02.jpg", result02, "base64");
