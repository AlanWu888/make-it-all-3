const ROLE = {
    ADMIN: 'admin',
    EMPLOYEE: 'employee',
    SPECIALIST: 'specialist'
  }
  
  module.exports = {
    ROLE: ROLE,
    users: [
      { id: 1, name: 'Kyle', role: ROLE.ADMIN },
      { id: 2, name: 'Sally', role: ROLE.EMPLOYEE },
      { id: 3, name: 'Joe', role: ROLE.SPECIALIST }
    ],
    projects: [
      { id: 1, name: "Kyle's Project", userId: 1 },
      { id: 2, name: "Sally's Project", userId: 2 },
      { id: 3, name: "Joe's Project", userId: 3 }
    ]
  }