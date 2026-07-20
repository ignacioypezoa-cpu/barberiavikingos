import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const key=new TextEncoder().encode(process.env.AUTH_SECRET||"development-secret-change-in-production");
export async function createCustomerSession(customerId:string){const token=await new SignJWT({customerId}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(key);(await cookies()).set("vikingos_customer",token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:604800})}
export async function getCustomerSession(){try{const token=(await cookies()).get("vikingos_customer")?.value;if(!token)return null;const{payload}=await jwtVerify(token,key);return payload.customerId as string}catch{return null}}
