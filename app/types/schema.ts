/** * Generated TypeScript types for Directus Schema * Generated on: 2025-06-15T13:37:19.597Z */
export interface Agenda {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  titulo: string;
  descricao: string;
  recorrente: boolean;
  dia: number;
  data_evento: 'datetime';
  hora_inicio: 'datetime';
  horario: 'datetime';
  instituicao: number | Instituicao;
  tipo_especial: string;
  data_limite: 'datetime';
}

export interface Catolico {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  nome: string;
  telefone: string;
  sexo: string;
  nascimento: 'datetime';
  instituicao: number | Instituicao;
}

export interface Instituicao {
  id: number;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  nome: string;
  catolico: string[] | Catolico[];
}

export interface DirectusUser {
  id: string;
  instituicao: number | Instituicao;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  location: string;
  title: string;
  description: string;
  tags: string;
  avatar: string;
  language: string;
  tfa_secret: boolean;
  status: string;
  role: string;
  token: string;
  last_access: string;
  last_page: string;
  provider: string;
  external_identifier: string;
  auth_data: string;
  email_notifications: boolean;
  appearance: string;
  theme_dark: string;
  theme_light: string;
  theme_light_overrides: string;
  theme_dark_overrides: string;
  policies: string;
}

export interface DirectusFile {
  id: string;
  storage: string;
  filename_disk: string;
  filename_download: string;
  title: string;
  type: string;
  folder: string;
  uploaded_by: string;
  uploaded_on: string;
  modified_by: string;
  modified_on: string;
  charset: string;
  filesize: number;
  width: number;
  height: number;
  duration: number;
  embed: string;
  description: string;
  location: string;
  tags: string;
  metadata: string;
  created_on: string;
  focal_point_x: string;
  focal_point_y: string;
  tus_id: string;
  tus_data: string;
}

export interface DirectusFolder {
  id: string;
  name: string;
  parent: string;
}

export interface DirectusRole {
  id: string;
  name: string;
  icon: string;
  description: string;
  admin_access: boolean;
  app_access: boolean;
  children: string;
  users: string;
  parent: string;
  policies: string;
}

export interface ApiCollections {
  agenda: Agenda[];
  catolico: Catolico[];
  instituicao: Instituicao[];
  directus_users: DirectusUser[];
  directus_files: DirectusFile[];
  directus_folders: DirectusFolder[];
  directus_roles: DirectusRole[];
}

