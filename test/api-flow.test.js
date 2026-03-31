const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

const registerAndLogin = async (name, email, role) => {
  const password = "Pass123";

  const register = await request(app)
    .post("/api/auth/register")
    .send({ name, email, password, role });

  expect(register.status).toBe(201);


  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  expect(login.status).toBe(200);

  return login.body.token;
};


describe("Appointment Flow", () => {
  let studentA1Token, studentA2Token, professorP1Token;
  let professorP1Id, slotT1Id, slotT2Id, appointmentA1Id;

  test("1. Student A1 authenticates", async () => {
    studentA1Token = await registerAndLogin("Student A1", "a1@gmail.com", "student");
    expect(studentA1Token).toBeDefined();
  });

  test("2. Professor P1 authenticates", async () => {
    professorP1Token = await registerAndLogin("Professor P1", "p1@gmail.com", "professor");
    expect(professorP1Token).toBeDefined();

    const professor = await mongoose.connection.db.collection("users").findOne({ email: "p1@gmail.com" });
    professorP1Id = professor._id.toString();
  });

  test("3. Professor P1 specifies slots for appointments", async () => {
    const slot1 = await request(app)
      .post("/api/user/add-slot")
      .set("Authorization", `Bearer ${professorP1Token}`)
      .send({
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
      });

    expect(slot1.status).toBe(201);

    const slot2 = await request(app)
      .post("/api/user/add-slot")
      .set("Authorization", `Bearer ${professorP1Token}`)
      .send({
        startTime: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 180 * 60 * 1000).toISOString(),
      });

    expect(slot2.status).toBe(201);
  });

  test("4. Student A1 views available slots for Professor P1", async () => {
    const slots = await request(app)
      .get(`/api/user/slots/${professorP1Id}?status=available`)
      .set("Authorization", `Bearer ${studentA1Token}`);

    expect(slots.status).toBe(200);

    expect(slots.body.data.length).toBeGreaterThan(0);
    slotT1Id = slots.body.data[0]._id;
  });

  test("5. Student A1 books an appointment with Professor P1 for time T1", async () => {
    const bookAppointment = await request(app)
      .post("/api/appointments/book-appointment")
      .set("Authorization", `Bearer ${studentA1Token}`)
      .send({ slotId: slotT1Id });

    expect(bookAppointment.status).toBe(201);
    appointmentA1Id = bookAppointment.body.data._id;
  });

  test("6. Student A2 authenticates", async () => {
    studentA2Token = await registerAndLogin("Student A2", "a2@gmail.com", "student");
    expect(studentA2Token).toBeDefined();
  });

  test("7. Student A1 views available slots for Professor P1", async () => {
    const slots = await request(app)
      .get(`/api/user/slots/${professorP1Id}?status=available`)
      .set("Authorization", `Bearer ${studentA2Token}`);

    expect(slots.status).toBe(200);

    expect(slots.body.data.length).toBeGreaterThan(0);
    slotT2Id = slots.body.data[0]._id;
  });

  test("8. Student A2 books an appointment with Professor P1 for time T2", async () => {
    const bookAppointment = await request(app)
      .post("/api/appointments/book-appointment")
      .set("Authorization", `Bearer ${studentA2Token}`)
      .send({ slotId: slotT2Id });

    expect(bookAppointment.status).toBe(201);
  });

  test("9. Professor P1 cancels the appointment with Student A1", async () => {
    const cancelAppointment = await request(app)
      .put(`/api/appointments/cancel-appointment/${appointmentA1Id}`)
      .set("Authorization", `Bearer ${professorP1Token}`);

    expect(cancelAppointment.status).toBe(200);
  });

  test("10. Student A1 checks their pending appointments", async () => {
    const pendingAppointments = await request(app)
      .get("/api/appointments/get-appointments?status=scheduled")
      .set("Authorization", `Bearer ${studentA1Token}`);

    expect(pendingAppointments.status).toBe(200);
    expect(pendingAppointments.body.data).toHaveLength(0);
  });
});