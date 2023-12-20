const { Cluster } = require('puppeteer-cluster');
const { getLinks, processLink } = require('./src/utils/utils');

const allResultsSet = new Set();

const urls = [
    'https://www.maze.com.br/',
    // 'https://www.sunika.com.br/',
    // 'https://www.artwalk.com.br/',
    'https://www.correderua.com.br/',
    // 'https://www.lojavirus.com.br/',
    // 'https://www.gdlp.com.br/',
    // 'https://youridstore.com.br/',
];

const storesObj = {
    maze: {
        name: 'Maze',
        baseUrl: 'https://www.maze.com.br/',
        selectors: {
            links: '.ui.card.produto.product-in-card.in-stock',
            productReference: '.row.desc_info > .column_1',
            img: '.produto.easyzoom',
            sneakerName: '#produto-nome',
            price: '#preco',
            availableSizes: '.ui.variacao.check:not(.sold) > button.ui.basic.button',
            pagination: '',
        }
    },
    sunika: {
        name: 'Sunika',
        baseUrl: 'https://www.sunika.com.br/',
        selectors: {
            links: 'li.purchasable',
            productReference: '',
            img: '.big-list',
            sneakerName: '.information div .name',
            price: '.priceContainer > strong > span',
            availableSizes: '.options > label:not(.unavailable) > span > b',
            pagination: '',
        }
    },
    correderua: {
        name: 'CDR',
        baseUrl: 'https://www.correderua.com.br/',
        selectors: {
            links: 'li.span3 > .cn-melhor-imagem:not(.indisponivel)',
            productReference: '.info-principal-produto span[itemprop^="sku"]',
            img: '.conteiner-imagem',
            sneakerName: '.nome-produto.titulo.cor-secundaria',
            price: '.preco-produto.destaque-preco strong[data-sell-price]',
            availableSizes: 'a.atributo-item:not(.indisponivel)',
            pagination: '.pagination ul li a',
        },
    },
    artwalk: {
        name: 'Artwalk',
        baseUrl: 'https://www.artwalk.com.br/',
        selectors: {
            links: '.product-item:not(.produto-indisponivel)',
            productReference: '.productReference',
            img: '.product-image.is-selected, .ns-product-image.is-selected',
            sneakerName: '.info-name-product > .productName',
            price: '.ns-product-price__value',
            availableSizes: '.dimension-Tamanho',
            pagination: '',
        },
    },
    gdlp: {
        name: 'GDLP',
        baseUrl: 'https://www.gdlp.com.br/',
        selectors: {
            links: 'li.item.last',
            productReference: '#product-attribute-specs-table tr.last.even > td',
            img: '.magic-slide.mt-active',
            sneakerName: '.product-name > .h1',
            price: '.regular-price > span.price, .special-price > span.price',
            availableSizes: 'option',
            pagination: '.amount--has-pages',
        },
    },
    lojavirus: {
        name: 'LojaVirus',
        baseUrl: 'https://www.lojavirus.com.br/',
        selectors: {
            links: '.imagem-spot',
            productReference: '.segura-nome > h1',
            img: 'figure[itemprop^="associatedMedia"]',
            sneakerName: '.fbits-produto-nome.prodTitle.title',
            price: '.precoPor',
            availableSizes: '.valorAtributo:not(.disabled)',
            pagination: '.fbits-paginacao ul li.pg a',
        },
    },
    // 'https://youridstore.com.br/': 'youridstore',
};

const searchFor = [
    // 'converse',
    // 'fila',
    'air force',
    // 'adidas superstar',
    // 'air max',
    // 'air jordan',
    // 'adidas forum',
    // 'adidas samba',
    // 'adidas gazelle',
    // 'adidas campus',
    // 'adidas ADI2000',
    // 'puma suede',
    // 'puma basket',
    // 'puma 180',
    // 'puma slipstream',
    // 'reebok classic',
    // 'reebok club c',
    // 'vans old skool',
    // 'vans authentic',
    // 'vans sk8',
    // 'vans era',
    // 'vans ultrarange',
    // 'asics gel',
    // 'fila corda'
];

async function mainCluster() {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 5,
        // monitor: true,
        puppeteerOptions: {
            // headless: "new",
            headless: false,
            defaultViewport: {
                width: 1366,
                height: 768,
            },
        }
    });

    async function processResultsCluster(results) {
        await cluster.task(async ({ page, data: { url } }) => {
            try {
                const storeObj = storesObj[url.replace(/.*?\/\/(?:www\.)?(.*?)\.com.*/, '$1')];
                await processLink(page, url, storeObj);
            } catch (error) {
                console.error(`Error processing ${url}:`, error.message);
            }
        });

        for (const url of results) {
            cluster.queue({ url });
        }
        await cluster.idle();
        await cluster.close();
    }

    await cluster.task(async ({ page, data: { url, term } }) => {
        try {
            const storeObj = storesObj[url.replace(/.*?\/\/(?:www\.)?(.*?)\.com.*/, '$1')];
            const links = await getLinks(page, url, storeObj, term);
            if (links !== undefined) {
                links.forEach(link => allResultsSet.add(link));
            }
        } catch (error) {
            console.error(`Error processing ${url} with term ${term}:`, error.message);
            console.error(error.stack);
        }
    });

    for (const url of urls) {
        for (const term of searchFor) {
            cluster.queue({ url, term });
        }
    }
    await cluster.idle();
    console.log(`${allResultsSet.size} total results`);
    await processResultsCluster([...allResultsSet]);
}

module.exports = mainCluster;