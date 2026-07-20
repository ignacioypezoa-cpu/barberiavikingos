import { NextRequest,NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {z}from"zod";
import{prisma}from"@/lib/prisma";
import{sendAccessCodeEmail}from"@/lib/emailService";
const schema=z.object({email:z.string().email()});
export async function POST(request:NextRequest){const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"Correo inválido."},{status:400});const customer=await prisma.customer.findFirst({where:{email:parsed.data.email.toLowerCase()}});if(!customer)return NextResponse.json({ok:true});const code=String(Math.floor(100000+Math.random()*900000));await prisma.customer.update({where:{id:customer.id},data:{accessCodeHash:await bcrypt.hash(code,10),accessCodeExpiresAt:new Date(Date.now()+15*60000)}});const sent=await sendAccessCodeEmail(customer.email,customer.name,code);if(!sent)return NextResponse.json({error:"El correo automático está desactivado. Contacta a Vikingos."},{status:503});return NextResponse.json({ok:true})}
