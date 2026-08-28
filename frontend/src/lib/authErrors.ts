const AUTH_ERROR_RULES: Array<[RegExp, string]> = [
  [/invalid (?:email or )?password|invalid login credentials|invalid credentials|incorrect email or password/i, "Неверный email или пароль. Проверьте данные и попробуйте снова."],
  [/email not confirmed/i, "Подтвердите email по ссылке из письма, затем войдите снова."],
  [/user already registered/i, "Пользователь с таким email уже зарегистрирован. Попробуйте войти."],
  [/unable to validate email address/i, "Введите корректный email."],
  [/signup is disabled/i, "Регистрация временно недоступна."],
  [/email rate limit exceeded|too many requests|security purposes/i, "Слишком много попыток. Подождите немного и попробуйте снова."],
  [/captcha/i, "Не удалось пройти проверку. Обновите капчу и попробуйте снова."],
  [/new password should be different from the old password/i, "Новый пароль должен отличаться от старого."],
  [/same password/i, "Новый пароль должен отличаться от старого."],
];

export function translateAuthError(message: string | null | undefined): string {
  if (!message) {
    return "Не удалось выполнить вход. Попробуйте ещё раз.";
  }

  if (/[А-Яа-яЁё]/.test(message)) {
    return message;
  }

  const passwordLengthMatch = message.match(/password should be at least (\d+) characters?/i);
  if (passwordLengthMatch) {
    return `Пароль слишком короткий. Используйте минимум ${passwordLengthMatch[1]} символов.`;
  }

  if (/password should contain/i.test(message)) {
    return "Пароль слишком слабый. Используйте буквы разного регистра, цифры и спецсимволы.";
  }

  for (const [pattern, translated] of AUTH_ERROR_RULES) {
    if (pattern.test(message)) {
      return translated;
    }
  }

  return "Не удалось выполнить действие. Проверьте данные и попробуйте ещё раз.";
}
