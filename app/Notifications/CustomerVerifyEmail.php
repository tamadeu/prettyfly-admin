<?php

namespace App\Notifications;

use App\Support\CustomerLinks;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomerVerifyEmail extends Notification
{
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Confirme seu e-mail')
            ->greeting('Olá, '.$notifiable->name.'!')
            ->line('Confirme seu e-mail para ativar sua conta.')
            ->action('Confirmar e-mail', CustomerLinks::verifyUrl($notifiable))
            ->line('O link vale por 24 horas. Se você não criou uma conta, ignore este e-mail.');
    }
}
