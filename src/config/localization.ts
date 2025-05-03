export type Locale = "en-US" | "es-ES" | "fr-FR" | "de-DE" | "zh-CN"; // Add more as needed

export interface ChartLabels {
  numberOfUsers: string;
  userRegistration: string;
  skillsRequested: string;
  skillsOffered: string;
  noOfRequests: string;
  noOfOffers: string;
  skillDistribution: string;
  statTitles: {
    totalUsers: string;
    noOfSessions: string;
    newUsersThisWeek: string;
    skillMatchRate: string;
    noOfSkillsRequested: string;
  };
  timeRanges: {
    today: string;
    week: string;
    month: string;
    year: string;
    all: string; // Add this
  };
  noDataMessage: string;
  loading: string;
}

const chartLabels: Record<Locale, ChartLabels> = {
  "en-US": {
    numberOfUsers: "Number of Users",
    userRegistration: "User Registration Over Time",
    skillsRequested: "Skills Requested",
    skillsOffered: "Skills Offered",
    noOfRequests: "No of Requests",
    noOfOffers: "No of Offers",
    skillDistribution: "Skill Distribution by Category",
    statTitles: {
      totalUsers: "Total Users",
      noOfSessions: "No of Sessions",
      newUsersThisWeek: "New Users This Week",
      skillMatchRate: "Skill Match Rate",
      noOfSkillsRequested: "No of Skills Requested",
    },
    timeRanges: {
      today: "Today",
      week: "Last 7 Days",
      month: "Last 30 Days",
      year: "Last 12 Months",
      all: "All Time", // Add this
    },
    noDataMessage: "No data available for the selected time range",
    loading: "Loading...",
  },
  // Add other languages as needed
  "es-ES": {
    numberOfUsers: "Número de Usuarios",
    userRegistration: "Registro de Usuarios a lo Largo del Tiempo",
    skillsRequested: "Habilidades Solicitadas",
    skillsOffered: "Habilidades Ofrecidas",
    noOfRequests: "N° de Solicitudes",
    noOfOffers: "N° de Ofertas",
    skillDistribution: "Distribución de Habilidades por Categoría",
    statTitles: {
      totalUsers: "Usuarios Totales",
      noOfSessions: "N° de Sesiones",
      newUsersThisWeek: "Nuevos Usuarios Esta Semana",
      skillMatchRate: "Tasa de Coincidencia",
      noOfSkillsRequested: "N° de Habilidades Solicitadas",
    },
    timeRanges: {
      today: "Hoy",
      week: "1 Semana",
      month: "1 Mes",
      year: "Año Completo",
      all: "Todo el Tiempo", // Add this
    },
    noDataMessage: "No hay datos disponibles para el período seleccionado",
    loading: "Cargando...",
  },
  "fr-FR": {
    // French labels
    numberOfUsers: "Nombre d'Utilisateurs",
    userRegistration: "Inscription des Utilisateurs",
    skillsRequested: "Compétences Demandées",
    skillsOffered: "Compétences Offertes",
    noOfRequests: "Nombre de Demandes",
    noOfOffers: "Nombre d'Offres",
    skillDistribution: "Distribution des Compétences par Catégorie",
    statTitles: {
      totalUsers: "Utilisateurs Totaux",
      noOfSessions: "Nombre de Sessions",
      newUsersThisWeek: "Nouveaux Utilisateurs cette Semaine",
      skillMatchRate: "Taux de Correspondance",
      noOfSkillsRequested: "Nombre de Compétences Demandées",
    },
    timeRanges: {
      today: "Aujourd'hui",
      week: "1 Semaine",
      month: "1 Mois",
      year: "Année Entière",
      all: "Tout le Temps", // Add this
    },
    noDataMessage: "Pas de données disponibles pour la période sélectionnée",
    loading: "Chargement...",
  },
  "de-DE": {
    // Placeholder for German
    numberOfUsers: "Anzahl der Nutzer",
    userRegistration: "Nutzerregistrierung im Zeitverlauf",
    skillsRequested: "Angefragte Fähigkeiten",
    skillsOffered: "Angebotene Fähigkeiten",
    noOfRequests: "Anzahl der Anfragen",
    noOfOffers: "Anzahl der Angebote",
    skillDistribution: "Verteilung der Fähigkeiten nach Kategorien",
    statTitles: {
      totalUsers: "Gesamtnutzer",
      noOfSessions: "Anzahl der Sitzungen",
      newUsersThisWeek: "Neue Nutzer diese Woche",
      skillMatchRate: "Trefferquote",
      noOfSkillsRequested: "Anzahl angefragter Fähigkeiten",
    },
    timeRanges: {
      today: "Heute",
      week: "1 Woche",
      month: "1 Monat",
      year: "Ganzes Jahr",
      all: "Alle Zeit", // Add this
    },
    noDataMessage: "Keine Daten für den ausgewählten Zeitraum verfügbar",
    loading: "Wird geladen...",
  },
  "zh-CN": {
    // Placeholder for Chinese
    numberOfUsers: "用户数",
    userRegistration: "用户注册时间线",
    skillsRequested: "请求的技能",
    skillsOffered: "提供的技能",
    noOfRequests: "请求数",
    noOfOffers: "提供数",
    skillDistribution: "技能类别分布",
    statTitles: {
      totalUsers: "总用户",
      noOfSessions: "会话数",
      newUsersThisWeek: "本周新用户",
      skillMatchRate: "技能匹配率",
      noOfSkillsRequested: "请求技能数",
    },
    timeRanges: {
      today: "今天",
      week: "一周",
      month: "一个月",
      year: "整年",
      all: "所有时间", // Add this
    },
    noDataMessage: "所选时间范围没有数据",
    loading: "加载中...",
  },
};

export default chartLabels;
