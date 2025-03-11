import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const existingUser = await prisma.jmkuserinfo.findFirst({
        where: { usr_email: "admin@example.com" },
    });

    if (existingUser?.usr_id) {
        // Update if the user already exists
        await prisma.jmkuserinfo.update({
            where: { usr_id: existingUser.usr_id },
            data: {
                usr_password: "test123",
                usr_role: "admin",
                usr_fname: "Super",
                usr_mname: "",
                usr_lname: "Admin",
                usr_access: JSON.stringify([
                    {
                        name: "StakeHolders",
                        option: [
                            {
                                name: "Admins",
                                access: [
                                    {
                                        create: true,
                                        read: true,
                                        update: true,
                                        delete: true,
                                    },
                                ],
                            },
                        ],
                    },
                ]),
            },
        });
        console.log("User updated successfully!");
    } else {
        // Create if the user does not exist
        await prisma.jmkuserinfo.create({
            data: {
                usr_email: "admin@example.com",
                usr_password: "test123",
                usr_role: "admin",
                usr_fname: "Super",
                usr_mname: "",
                usr_lname: "Admin",
                usr_access: JSON.stringify([
                    {
                        name: "StakeHolders",
                        option: [
                            {
                                name: "Admins",
                                access: [
                                    {
                                        create: true,
                                        read: true,
                                        update: true,
                                        delete: true,
                                    },
                                ],
                            },
                        ],
                    },
                ]),
            },
        });
        console.log("User created successfully!");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
