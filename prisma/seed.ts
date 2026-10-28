import { PrismaClient, UserRole, DriverStatus, DriverAvailability } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding development database...');

  // Create service zones
  const bangaloreZone = await prisma.serviceZone.upsert({
    where: { name: 'Bangalore Central' },
    update: {},
    create: {
      name: 'Bangalore Central',
      city: 'Bangalore',
      state: 'Karnataka',
      isActive: true,
      coordinates: {
        type: 'Polygon',
        coordinates: [[
          [77.5, 12.9], [77.7, 12.9], [77.7, 13.1], [77.5, 13.1], [77.5, 12.9]
        ]]
      }
    }
  });

  console.log('✅ Service zones created');

  // Create pricing rule
  await prisma.pricingRule.upsert({
    where: { id: 'default-bangalore' },
    update: {},
    create: {
      id: 'default-bangalore',
      zoneId: bangaloreZone.id,
      name: 'Standard Bangalore',
      baseFare: 99,
      perKmRate: 18,
      perMinuteRate: 2,
      minimumFare: 150,
      nightSurcharge: 50,
      waitingCharge: 3,
      returnCharge: 250,
      outstationRate: 25,
      gstPercent: 5,
      isActive: true,
    }
  });

  console.log('✅ Pricing rules created');

  // Create dev customer user
  const customerUser = await prisma.user.upsert({
    where: { phone: '+919999999901' },
    update: {},
    create: {
      firebaseUid: 'dev-customer-uid-001',
      phone: '+919999999901',
      email: 'customer@drivesafe.dev',
      role: UserRole.CUSTOMER,
      profile: {
        create: {
          fullName: 'Rahul Sharma',
          email: 'customer@drivesafe.dev',
        }
      },
      savedAddresses: {
        create: [
          {
            label: 'Home',
            address: 'Koramangala, Bengaluru, Karnataka 560034',
            lat: 12.9352,
            lng: 77.6245,
            isDefault: true
          },
          {
            label: 'Work',
            address: 'HSR Layout, Bengaluru, Karnataka 560102',
            lat: 12.9116,
            lng: 77.6389,
          }
        ]
      },
      vehicles: {
        create: [
          {
            make: 'Honda',
            model: 'City',
            year: 2022,
            color: 'White',
            licensePlate: 'KA01AB1234',
            isDefault: true
          }
        ]
      }
    }
  });

  console.log('✅ Customer user created: +919999999901');

  // Create dev driver user
  const driverUser = await prisma.user.upsert({
    where: { phone: '+919999999902' },
    update: {},
    create: {
      firebaseUid: 'dev-driver-uid-001',
      phone: '+919999999902',
      email: 'driver@drivesafe.dev',
      role: UserRole.DRIVER,
      profile: {
        create: {
          fullName: 'Arun Kumar',
          email: 'driver@drivesafe.dev',
        }
      }
    }
  });

  // Create driver record
  await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      licenseNumber: 'KA0120230001234',
      licenseExpiry: new Date('2028-12-31'),
      status: DriverStatus.VERIFIED,
      availability: DriverAvailability.ONLINE,
      currentLat: 12.9352,
      currentLng: 77.6245,
      operatingZoneId: bangaloreZone.id,
      rating: 4.8,
      totalRides: 128,
      bio: 'Professional designated driver with 5+ years experience. Safe, punctual, and courteous.',
      languages: ['Kannada', 'Hindi', 'English']
    }
  });

  console.log('✅ Driver user created: +919999999902');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { phone: '+919999999900' },
    update: {},
    create: {
      firebaseUid: 'dev-admin-uid-001',
      phone: '+919999999900',
      email: 'admin@drivesafe.dev',
      role: UserRole.ADMIN,
      profile: {
        create: {
          fullName: 'DriveSafe Admin',
          email: 'admin@drivesafe.dev',
        }
      },
      adminUser: {
        create: {
          permissions: ['ALL']
        }
      }
    }
  });

  console.log('✅ Admin user created: +919999999900');

  console.log('\n🎉 Seed completed!');
  console.log('─'.repeat(40));
  console.log('DEV ACCOUNTS (use OTP: 123456 in dev mode)');
  console.log('  Customer: +91 99999 99901');
  console.log('  Driver:   +91 99999 99902');
  console.log('  Admin:    +91 99999 99900');
  console.log('─'.repeat(40));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
