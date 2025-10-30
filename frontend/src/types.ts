export interface Block {
  id: number;
  type: 'text' | 'image';
  content?: string;
  style?: 'h1' | 'h2' | 'h3' | 'p';
  imageUrl?: string;
  width?: number;
  height?: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}
