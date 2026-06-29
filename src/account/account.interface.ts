export interface AccountInfo {
  id: string;
  handle: string;
  name: string;
  thumbnail_url?: string;
  is_selected: boolean;
  is_disabled: boolean;
  pageId?: string;
}
