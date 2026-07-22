const base = process.env.TEST_URL || "http://localhost:3101";
const json = { "Content-Type": "application/json" };

const login = await fetch(`${base}/api/auth/login`, {
  method: "POST", headers: json,
  body: JSON.stringify({ email: "ignacio.ypezoa@gmail.com", password: "sherift09" })
});
if (!login.ok) throw new Error(`Login falló: ${login.status}`);
const cookie = login.headers.getSetCookie()[0].split(";")[0];
const auth = { ...json, Cookie: cookie };

const branchResponse = await fetch(`${base}/api/admin/branches`, {
  method: "POST", headers: auth,
  body: JSON.stringify({
    name: "Sucursal Prueba Dinamica", address: "Calle 123", commune: "Nunoa",
    city: "Santiago", phone: "+56222222222", whatsapp: "+56922222222",
    openingTime: "09:00", closingTime: "19:00", mapUrl: "", image: "", active: true
  })
});
if (!branchResponse.ok) throw new Error(`Crear sucursal falló: ${branchResponse.status} ${await branchResponse.text()}`);
const branch = await branchResponse.json();
const createdVisible = (await (await fetch(base)).text()).includes("Sucursal Prueba Dinamica");

await fetch(`${base}/api/admin/branches/${branch.id}`, { method: "PATCH", headers: auth, body: JSON.stringify({ active: false }) });
const inactiveHidden = !(await (await fetch(base)).text()).includes("Sucursal Prueba Dinamica");
await fetch(`${base}/api/admin/branches/${branch.id}`, { method: "DELETE", headers: auth });

const config = await (await fetch(`${base}/api/admin/config`, { headers: { Cookie: cookie } })).json();
const originalTitle = config.heroTitle;
config.heroTitle = "Titulo dinamico confirmado";
await fetch(`${base}/api/admin/config`, { method: "PATCH", headers: auth, body: JSON.stringify(config) });
const configReflected = (await (await fetch(base)).text()).includes("Titulo dinamico confirmado");
config.heroTitle = originalTitle;
await fetch(`${base}/api/admin/config`, { method: "PATCH", headers: auth, body: JSON.stringify(config) });

const activeBranch = (await (await fetch(`${base}/api/admin/branches`, { headers: { Cookie: cookie } })).json()).find((item) => item.active);
const serviceResponse = await fetch(`${base}/api/admin/services`, { method: "POST", headers: auth, body: JSON.stringify({ name: "Servicio Smoke Test", description: "Servicio temporal de validación", category: "Pruebas", duration: 30, price: 9990, image: "", active: true }) });
if (!serviceResponse.ok) throw new Error(`Crear servicio falló: ${await serviceResponse.text()}`);
const service = await serviceResponse.json();
const serviceVisible = (await (await fetch(base)).text()).includes("Servicio Smoke Test") && (await (await fetch(`${base}/reservar`)).text()).includes("Servicio Smoke Test");

const barberResponse = await fetch(`${base}/api/admin/barbers`, { method: "POST", headers: auth, body: JSON.stringify({ firstName: "Barbero", lastName: "Temporal", specialty: "Pruebas", bio: "Registro temporal para validar sincronización.", phone: "+56933333333", email: "barbero.temporal@prueba.cl", branchId: activeBranch.id, serviceIds: [service.id], startTime: "09:00", endTime: "18:00", photo: "", active: true }) });
if (!barberResponse.ok) throw new Error(`Crear barbero falló: ${await barberResponse.text()}`);
const barber = await barberResponse.json();
const barberHomeVisible = (await (await fetch(base)).text()).includes("Temporal");
const barberBookingAvailable = (await (await fetch(`${base}/api/catalog`)).json()).barbers.some((item) => item.id === barber.id);
const barberVisible = barberHomeVisible && barberBookingAvailable;

const productResponse = await fetch(`${base}/api/admin/products`, { method: "POST", headers: auth, body: JSON.stringify({ name: "Producto Smoke Test", sku: `SMOKE-${Date.now()}`, description: "Producto temporal de validación", category: "Pruebas", brand: "Test", price: 5990, stock: 3, image: "", active: true }) });
if (!productResponse.ok) throw new Error(`Crear producto falló: ${await productResponse.text()}`);
const product = await productResponse.json();
const productVisible = (await (await fetch(`${base}/productos`)).text()).includes("Producto Smoke Test");

await fetch(`${base}/api/admin/barbers/${barber.id}`, { method: "PATCH", headers: auth, body: JSON.stringify({ active: false }) });
await fetch(`${base}/api/admin/services/${service.id}`, { method: "PATCH", headers: auth, body: JSON.stringify({ active: false }) });
await fetch(`${base}/api/admin/products/${product.id}`, { method: "PATCH", headers: auth, body: JSON.stringify({ active: false }) });
const disabledHidden = !(await (await fetch(base)).text()).includes("Barbero Temporal") && !(await (await fetch(base)).text()).includes("Servicio Smoke Test") && !(await (await fetch(`${base}/productos`)).text()).includes("Producto Smoke Test");
await fetch(`${base}/api/admin/barbers/${barber.id}`, { method: "DELETE", headers: auth });
await fetch(`${base}/api/admin/services/${service.id}`, { method: "DELETE", headers: auth });
await fetch(`${base}/api/admin/products/${product.id}`, { method: "DELETE", headers: auth });

const result = { authenticated: true, branchSync: createdVisible && inactiveHidden, configReflected, serviceVisible, barberVisible, productVisible, disabledHidden, cleanup: true };
console.log(JSON.stringify(result, null, 2));
if (Object.values(result).some((value) => !value)) process.exitCode = 1;
