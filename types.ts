
export interface Quote {
  id: string | number;
  text: string;
  author: string;
  from?: string;
  imageUrl: string;
  timestamp: number;
}

export interface CollectionItem extends Quote {}
