const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

function EmailValidate(email) {
    if (!isValidEmail(email)) {
        throw new AuthenticationError('Invalid email format');
    }
}

export { EmailValidate }