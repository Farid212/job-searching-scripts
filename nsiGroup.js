async function getRawOffers() {
  try {
    const resopnse = await fetch("https://careers.nsigroup.eu/offre-demploi");
    let htmlText = await resopnse.text();
    htmlText = htmlText.replace(/&quot;/g, '"');
    htmlText = htmlText.replace(/&#27;/g, "'");
    htmlText = htmlText.replace(/&#39;/g, "'");
    // console.log(htmlText);
    return htmlText;
  } catch (err) {
    return err;
  }
}

function filter(offers) {
  return offers.filter((offer) => {
    const title =
      offer.translations.en?.title ||
      offer.translations.fr?.title ||
      offer.translations.nl?.title;
    const titleLowerCase = title.toLowerCase();

    return ["react", "node", "javascript", "support"].some((keyword) =>
      titleLowerCase.includes(keyword)
    );
  });
}

async function getRawOffer(slug) {
  try {
    const response = await fetch("https://careers.nsigroup.eu/o/" + slug);
    let htmlText = await response.text();
    htmlText = htmlText.replace(/&quot;/g, '"');
    htmlText = htmlText.replace(/&#27;/g, "'");
    htmlText = htmlText.replace(/&#39;/g, "'");

    return htmlText;
  } catch (err) {
    return err;
  }
}

async function extractDataProps(htmlText) {
  const regex =
    /<div\s+data-rendered\s+data-component="PublicApp"\s+data-props="(.+?)">\s*</is;

  const matches = regex.exec(htmlText);

  if (matches && matches[1]) {
    try {
      const dataProps = JSON.parse(matches[1]);
      return dataProps;
    } catch (error) {
      console.error("Error during parsing data-props to JSON:", error);
    }
  } else {
    console.log("No data-props.");
  }
}

function decodeHtmlEntities(text) {
  const entitiesMap = {
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
  };
  return text.replace(
    /&lt;|&gt;|&amp;|&quot;|&#39;/g,
    (match) => entitiesMap[match]
  );
}

function stripHtmlTags(html) {
  return html.replace(/<[^>]*>/g, "");
}

function decodeAndStripHtml(htmlString) {
  return stripHtmlTags(decodeHtmlEntities(htmlString));
}

function cleanObjectStrings(el) {
  const cleaned = decodeAndStripHtml(decodeHtmlEntities(el));
  return cleaned;
}

async function processOffers(filtered) {
  const results = [];
  for (const o of filtered) {
    try {
      const htmlText = await getRawOffer(o.slug);
      const dataProps = await extractDataProps(htmlText);
      let offer = dataProps.appConfig.offer;
      const data = {
        country: offer.translations.fr
          ? offer.translations.fr.country
          : offer.translations.en.country,
        description: cleanObjectStrings(
          offer.translations.fr
            ? offer.translations.fr.description
            : offer.translations.en.description
        ),
        requirements: cleanObjectStrings(
          offer.translations.fr
            ? offer.translations.fr.requirements
            : offer.translations.en.requirements
        ),
      };

      results.push(data);
    } catch (error) {
      console.error(error);
    }
  }
  return results;
}

async function main() {
  try {
    const rawOffers = await getRawOffers();
    const dataProps = await extractDataProps(rawOffers);
    const offers = dataProps.appConfig.offers;
    const filtered = filter(offers);
    const processed = await processOffers(filtered);
    return processed;
  } catch (error) {
    console.error(error);
  }
}

main()
  .then((processed) => {
    const tmp = JSON.stringify(processed, null, 2);
    console.log(tmp);
  })
  .catch((error) => {
    console.error(error);
  });
