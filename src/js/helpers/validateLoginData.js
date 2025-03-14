const validateEmail = (email) => {
  const regEmail =
    /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu;
  const chek = regEmail.test(email);

  return chek;
};

const validatePassword = (pasword) => {
  const regPass = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{5,20}$/;
  const chek = regPass.test(pasword);

  return chek;
};

export { validateEmail, validatePassword };
