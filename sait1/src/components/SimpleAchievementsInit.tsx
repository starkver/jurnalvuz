// Упрощенная версия инициализатора достижений для критических случаев
export function initializeBasicAchievements() {
  const achievements = localStorage.getItem('achievements');
  
  if (!achievements) {
    const basicAchievements = [
      {
        id: "welcome",
        title: "Добро пожаловать!",
        description: "Первый вход в образовательный портал",
        icon: "Star",
        color: "primary",
        course: "all",
        dateCreated: "2024-01-01T00:00:00.000Z",
        criteria: "Зарегистрироваться и войти в систему",
        points: 5,
        isActive: true
      }
    ];
    
    localStorage.setItem('achievements', JSON.stringify(basicAchievements));
  }
}

// Простая функция для присвоения достижения за вход
export function awardWelcomeAchievement(username: string) {
  if (!username) return;
  
  const studentAchievements = JSON.parse(localStorage.getItem('studentAchievements') || '[]');
  
  const hasWelcome = studentAchievements.some(
    (sa: any) => sa.studentId === username && sa.achievementId === 'welcome'
  );
  
  if (!hasWelcome) {
    studentAchievements.push({
      studentId: username,
      achievementId: 'welcome',
      dateEarned: new Date().toISOString()
    });
    
    localStorage.setItem('studentAchievements', JSON.stringify(studentAchievements));
  }
}