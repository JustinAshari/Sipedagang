<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $defaultPassword = env('SUPERADMIN_PASSWORD', 'SuperAdmin123');

        User::updateOrCreate(
            ['nama_pengguna' => 'superadmin'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make($defaultPassword),
                'plain_password' => $defaultPassword,
                'role' => 'superadmin',
            ]
        );
    }
}
