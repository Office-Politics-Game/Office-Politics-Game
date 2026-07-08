const PASSWORD_RULE_ERROR_MESSAGE = "密碼格式不符合規則"

const PASSWORD_ALLOWED_CHARS_REGEX = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"|,.<>/?`~]+$/

const PASSWORD_SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"|,.<>/?`~]/

const PASSWORD_RULES = [
  {
    key: "length",
    label: "8-16 個字元",
    test: (password) => password.length >= 8 && password.length <= 16
  },
  {
    key: "lowercase",
    label: "至少一個小寫英文",
    test: (password) => /[a-z]/.test(password)
  },
  {
    key: "uppercase",
    label: "至少一個大寫英文",
    test: (password) => /[A-Z]/.test(password)
  },
  {
    key: "number",
    label: "至少一個數字",
    test: (password) => /[0-9]/.test(password)
  },
  {
    key: "specialChar",
    label: "至少一個特殊符號",
    test: (password) => PASSWORD_SPECIAL_CHAR_REGEX.test(password)
  },
  {
    key: "allowedChars",
    label: "只能使用英文、數字或標點符號",
    test: (password) => PASSWORD_ALLOWED_CHARS_REGEX.test(password)
  }
]

function getPasswordRuleChecks(password) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    isValid: rule.test(password || "")
  }))
}

function validatePasswordFormat(password) {
  return PASSWORD_RULES.every((rule) => rule.test(password || ""))
}

function getPasswordError(password) {
  if (!password) {
    return "請輸入密碼"
  }

  if (!validatePasswordFormat(password)) {
    return PASSWORD_RULE_ERROR_MESSAGE
  }

  return ""
}

export {
  PASSWORD_RULE_ERROR_MESSAGE,
  PASSWORD_RULES,
  getPasswordRuleChecks,
  validatePasswordFormat,
  getPasswordError
}