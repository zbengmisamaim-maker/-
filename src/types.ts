export interface Survey {
  id: number;
  name?: string;
  question: string;
  options: string[];
  languages: string[];
  created_at: string;
  deleted_at?: string | null;
}

export interface Vote {
  id: number;
  survey_id: number;
  employee_name: string;
  answer: string;
  other_text: string | null;
  created_at: string;
}

export interface Favorite {
  id: number;
  name: string;
  question: string;
  options: string[];
  languages: string[];
  created_at: string;
}

export interface Stats {
  daily: { answer: string; count: number }[];
  monthly: { answer: string; count: number }[];
  recentVotes: Vote[];
  activeSurvey: Survey;
  favorites?: Favorite[];
}

export type Language = 'he' | 'ru';

export const TRANSLATIONS = {
  he: {
    title: "סקר ארוחת צהריים",
    adminTitle: "לוח בקרה למנהל",
    nameLabel: "שם מלא",
    questionLabel: "שאלה",
    optionsLabel: "אפשרויות",
    submit: "שלח הצבעה",
    other: "אחר (פרט...)",
    success: "תודה! הצבעתך התקבלה.",
    alreadyVoted: "כבר הצבעת היום!",
    createSurvey: "צור סקר חדש",
    dailyResults: "תוצאות היום",
    monthlyStats: "סטטיסטיקה חודשית",
    languageSelect: "בחר שפה",
    addOption: "הוסף אפשרות",
    saveSurvey: "שמור ופרסם סקר",
    voters: "מצביעים אחרונים",
    noSurvey: "אין סקר פעיל כרגע",
    chooseLanguage: "בחר שפה / Выберите язык",
    favorites: "מועדפים",
    saveToFavorites: "שמור במועדפים",
    useTemplate: "השתמש בסקר זה",
    noFavorites: "אין סקרים שמורים במועדפים",
    surveyDate: "סקר לתאריך",
    surveyNameLabel: "שם הסקר (לשימוש פנימי)",
    favoritesExplainer: "מועדפים הם תבניות של סקרים שאתה אוהב. שמירה במועדפים מאפשרת לך להפעיל את אותו סקר שוב ושוב בימים שונים מבלי להקליד הכל מחדש. התוצאות של כל יום יישמרו בנפרד.",
  },
  ru: {
    title: "Опрос по обеду",
    adminTitle: "Панель управления",
    nameLabel: "Полное имя",
    questionLabel: "Вопрос",
    optionsLabel: "Варианты",
    submit: "Проголосовать",
    other: "Другое (уточните...)",
    success: "Спасибо! Ваш голос принят.",
    alreadyVoted: "Вы уже голосовали сегодня!",
    createSurvey: "Создать новый опрос",
    dailyResults: "Результаты за сегодня",
    monthlyStats: "Ежемесячная статистика",
    languageSelect: "Выберите язык",
    addOption: "Добавить вариант",
    saveSurvey: "Сохранить и опубликовать",
    voters: "Последние голоса",
    noSurvey: "Нет активных опросов",
    chooseLanguage: "Выберите язык / בחר שפה",
    favorites: "Избранное",
    saveToFavorites: "Сохранить в избранное",
    useTemplate: "Использовать этот опрос",
    noFavorites: "Нет сохраненных опросов",
    surveyDate: "Опрос на дату",
    surveyNameLabel: "Название опроса (для себя)",
    favoritesExplainer: "Избранное — это шаблоны опросов. Сохранение в избранное позволяет запускать один и тот же опрос в разные дни, не заново вводя данные. Результаты каждого дня сохраняются отдельно.",
  }
};
