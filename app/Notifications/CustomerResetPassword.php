<?php

namespace App\Notifications;

use App\Support\CustomerLinks;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomerResetPassword extends Notification
{
    public function __construct(private readonly string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $minutes = config('auth.passwords.users.expire');

        return (new MailMessage)
            ->subject('Redefinição de senha')
            ->greeting('Olá, '.$notifiable->name.'!')
            ->line('Recebemos um pedido para redefinir a senha da sua conta.')
            ->action('Redefinir senha', CustomerLinks::resetUrl($notifiable, $this->token))
            ->line("Este link expira em {$minutes} minutos.")
            ->line('Se você não fez esse pedido, ignore este e-mail.');
    }
}
