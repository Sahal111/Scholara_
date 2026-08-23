<?php

namespace App\Providers;

use App\Models\Guru;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\Scopes\SchoolScope;
use App\Observers\GuruObserver;
use App\Observers\KelasObserver;
use App\Observers\SiswaObserver;
use App\Policies\GuruPolicy;
use App\Policies\KelasPolicy;
use App\Policies\SiswaPolicy;
use App\Policies\TahunAjaranPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    protected array $policies = [
        Guru::class => GuruPolicy::class,
        Siswa::class => SiswaPolicy::class,
        Kelas::class => KelasPolicy::class,
        TahunAjaran::class => TahunAjaranPolicy::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Policies
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }

        // Observers
        Guru::observe(GuruObserver::class);
        Siswa::observe(SiswaObserver::class);
        Kelas::observe(KelasObserver::class);

        // Pakai custom PersonalAccessToken yang bypass SchoolScope
        \Laravel\Sanctum\Sanctum::usePersonalAccessTokenModel(
            \App\Models\PersonalAccessToken::class
        );
    }
}