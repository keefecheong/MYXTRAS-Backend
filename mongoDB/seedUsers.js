// seed the database with user accounts

const { User } = require("../user/models/user.js");
const bcrypt = require("bcryptjs");

// seed users
module.exports = async function seedData() {
  const existingUsers = await User.find({}, { email: 1 }).lean();

  const users = [
    new User({
      email: "admin_1@gmail.com",
      username: "admin_1",
      real_name: "admin one",
      phone_number: 11000000,
      school: "ICT",
      course: "CSF",
      is_admin: true,
      password: await bcrypt.hash("Passw0rd", 10),
      is_profile_setup: true,
    }),
    new User({
      email: "admin_2@gmail.com",
      username: "admin_2",
      real_name: "admin two",
      phone_number: 12000000,
      school: "ICT",
      course: "CSF",
      is_admin: true,
      password: await bcrypt.hash("Passw0rd", 10),
      is_profile_setup: true,
    }),
    new User({
      email: "user_1@gmail.com",
      username: "user_1",
      real_name: "user one",
      phone_number: 21000000,
      school: "ICT",
      course: "CSF",
      is_admin: false,
      password: await bcrypt.hash("Passw0rd", 10),
      is_profile_setup: true,
    }),
    new User({
      email: "user_2@gmail.com",
      username: "user_2",
      real_name: "user two",
      phone_number: 22000000,
      school: "ICT",
      course: "CSF",
      is_admin: false,
      password: await bcrypt.hash("Passw0rd", 10),
      is_profile_setup: true,
    }),
  ];

  // only insert new users that do not already exist (based on email)
  const newUsers = users.filter(
    (user) =>
      !existingUsers.some((existingUser) => existingUser.email == user.email),
  );

  if (newUsers.length <= 0) return console.log("No users to seed");

  await User.insertMany(newUsers)
    .then(() => console.log("Users seeded successfully"))
    .catch((error) => console.log(error));
};
