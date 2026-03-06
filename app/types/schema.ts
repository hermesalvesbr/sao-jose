/** * Generated TypeScript types for Directus Schema */
export interface AdsLog {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  ads: string | AdsNovenario;
  /** Segundos efetivamente exibidos (pode diferir da duração programada em vídeos) */
  duracao_exibida: number;
  /** Data e hora exata em que o anúncio começou a ser exibido no telão */
  exibido_em: 'datetime';
  /** Nome do anunciante (denormalizado para relatórios) */
  anunciante: string;
  /** Tipo de mídia exibida (imagem ou video) */
  tipo_midia: string;
}

export interface AdsNovenario {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  /** Nome do anunciante/patrocinador */
  anunciante: string;
  /** Imagem ou vídeo do anúncio */
  midia: string;
  /** Tipo de mídia: imagem ou vídeo */
  tipo_midia: string;
  /** Tempo de exibição em segundos (múltiplo de 5) */
  duracao: number;
  /** Valor pago pelo anunciante em R$ */
  valor_pago: number;
  /** Data em que o pagamento foi recebido */
  data_pagamento: 'datetime';
  /** Situação do pagamento do anúncio */
  status_pagamento: string;
  /** Meio de pagamento utilizado */
  meio_pagamento: string;
}

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

export interface Dizimista {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  catolico: string | Catolico;
  /** Use ponto em separação decimal */
  valor_mensal: number;
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

export interface OfertaFinanceira {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  evento: string | Agenda;
  valor: number;
  data_entrada: 'datetime';
  meio: string;
  observacao: string;
}

export interface PagamentoDizimo {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  valor_pago: number;
  dizimista: string | Dizimista;
  meio: string;
  data_pagamento: 'datetime';
}

export interface PdvCashWithdrawal {
  id: number;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  /** Valor retirado do caixa em R$ */
  valor: number;
  /** Motivo da sangria (ex: troco, pagamento fornecedor) */
  motivo: string;
  /** Data e hora exata da retirada */
  data_hora: 'datetime';
  /** Operador responsável */
  operator_id: string | PdvOperator;
  /** Observações adicionais */
  observacao: string;
}

export interface PdvCategory {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  sort_order: number;
  active: boolean;
  name: string;
  icon: string;
  points_id: string | PdvProductionPoint;
}

export interface PdvExpense {
  id: number;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  /** Descrição da despesa */
  descricao: string;
  /** Valor em R$ */
  valor: number;
  /** Data da despesa */
  data_despesa: 'datetime';
  /** Operador/Responsável pela despesa */
  operator_id: string | PdvOperator;
  /** Observações adicionais */
  observacao: string;
}

export interface PdvOperator {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  name: string;
  active: boolean;
}

export interface PdvProductionPoint {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  name: string;
  active: boolean;
}

export interface PdvProduct {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  name: string;
  active: boolean;
  stock_quantity: number;
  price: number;
  sort_order: number;
  imagem: string | DirectusFile;
  category_id: string | PdvCategory;
  production_point_id: string | PdvProductionPoint;
}

export interface PdvSaleItem {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  quantity: number;
  total_price: number;
  unit_price: number;
  /** Quantidade devolvida/trocada deste item */
  returned_qty: number;
  product_id: string | PdvProduct;
  sale_id: string | PdvSale;
}

export interface PdvSale {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  sale_number: number;
  total_amount: number;
  payment_method: string;
  sale_status: string;
  printed: boolean;
  created_at: 'datetime';
  operator_id: string | PdvOperator;
}

export interface PdvSchedule {
  id: number;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
  /** Dia da escala (YYYY-MM-DD) */
  data: 'datetime';
  /** Barraca / Ponto de produção */
  production_point_id: string | PdvProductionPoint;
  /** Nomes dos voluntários (um por linha ou separados por vírgula) */
  voluntarios: string;
  /** Observações do dia */
  observacao: string;
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
  tags: string[];
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
  folder: string | DirectusFolder;
  uploaded_by: string | DirectusUser;
  uploaded_on: string;
  modified_by: string | DirectusUser;
  modified_on: string;
  charset: string;
  filesize: number;
  width: number;
  height: number;
  duration: number;
  embed: string;
  description: string;
  location: string;
  tags: string[];
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
  parent: string | DirectusFolder;
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
  parent: string | DirectusRole;
  policies: string;
}

export interface ApiCollections {
  ads_log: AdsLog[];
  ads_novenario: AdsNovenario[];
  agenda: Agenda[];
  catolico: Catolico[];
  dizimista: Dizimista[];
  instituicao: Instituicao[];
  oferta_financeira: OfertaFinanceira[];
  pagamento_dizimo: PagamentoDizimo[];
  pdv_cash_withdrawals: PdvCashWithdrawal[];
  pdv_categories: PdvCategory[];
  pdv_expenses: PdvExpense[];
  pdv_operators: PdvOperator[];
  pdv_production_points: PdvProductionPoint[];
  pdv_products: PdvProduct[];
  pdv_sale_items: PdvSaleItem[];
  pdv_sales: PdvSale[];
  pdv_schedules: PdvSchedule[];
  directus_users: DirectusUser[];
  directus_files: DirectusFile[];
}

