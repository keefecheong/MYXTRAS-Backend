// function to check password strength

function passwordRequirements(password) {
  const consecutiveLimit = 3;
  if (password.length < 4 || isPasswordSingleType(password)) {
    return "very-weak";
  }
  this.passwordStrength = 0;

  if (/[A-Z]/.test(password)) {
    this.passwordStrength++;
  }

  if (/\d/.test(password)) {
    this.passwordStrength++;
  }
  if (password.length > 14) {
    this.passwordStrength++;
  }
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    this.passwordStrength++;
  }
  // checks for 3 consecutive characters
  for (let i = 0; i < password.length - consecutiveLimit + 1; i++) {
    let isConsecutive = true;
    for (let j = i + 1; j < i + consecutiveLimit; j++) {
      if (password[j] !== password[i]) {
        isConsecutive = false;
        break;
      }
    }
    if (isConsecutive) {
      if (this.passwordStrength === 0) {
        break;
      }
      this.passwordStrength--;
    }
  }
  if (this.passwordStrength === 0) {
    return "very-weak";
  } else if (this.passwordStrength === 1) {
    return "weak";
  } else if (this.passwordStrength === 2 || this.passwordStrength === 3) {
    return "strong";
  } else {
    return "very-strong";
  }
}

function isPasswordSingleType(password) {
  const lowercaseRegex = /^[a-z]+$/;
  const uppercaseRegex = /^[A-Z]+$/;
  const symbolRegex = /^[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/;
  const numberRegex = /^[0-9]+$/;
  if (
    lowercaseRegex.test(password) ||
    uppercaseRegex.test(password) ||
    symbolRegex.test(password) ||
    numberRegex.test(password)
  ) {
    return true;
  }

  return false;
}

module.exports = {
  passwordRequirements,
};
