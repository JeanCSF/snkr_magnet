export type Sneakers = {
    _id: string;
    srcLink: string;
    productReference: string;
    store: string;
    brands: string[];
    img: string;
    sneakerTitle: string;
    categories: string[];
    colors: string[];
    currentPrice: number;
    discountPrice: number | null;
    priceHistory: {
        price: number;
        date: string;
        _id: string;
    }[];
    availableSizes: number[];
    codeFromStore: string;
    createdAt: string;
    updatedAt: string;
}

export type apiResponse = {
    sneakers: Sneakers[];
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    totalCount: number;
}

export type Item = {
    id: string;
    name: string;
};
