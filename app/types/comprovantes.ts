export interface DirectusAttachmentFile {
  id: string
  title?: string
  type?: string
  filesize?: number
  filename_download?: string
}

export interface ReceitaComprovanteItem {
  id: number
  receita_id?: string | null
  directus_files_id: string | DirectusAttachmentFile
}
