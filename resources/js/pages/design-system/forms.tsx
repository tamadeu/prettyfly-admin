import React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layout/dashboard';

function FormsPage() {
    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        toast.success('Configurações salvas');
    }

    return (
        <main className="mx-auto w-full max-w-5xl space-y-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">Entrada de dados</p>
                <h1 className="text-2xl font-semibold">Formulários</h1>
                <p className="text-muted-foreground mt-1 text-sm">Estrutura recomendada para configurações e edição de dados.</p>
            </div>

            <form onSubmit={submit} className="rounded-lg border bg-card px-5 sm:px-7">
                <FormSection title="Informações pessoais" description="Dados básicos usados para identificar sua conta.">
                    <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
                        <Field>
                            <FieldLabel htmlFor="first-name">Nome</FieldLabel>
                            <Input id="first-name" name="firstName" defaultValue="Emma" />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="last-name">Sobrenome</FieldLabel>
                            <Input id="last-name" name="lastName" defaultValue="Crown" />
                        </Field>
                        <Field className="sm:col-span-2">
                            <FieldLabel htmlFor="email">E-mail</FieldLabel>
                            <Input id="email" name="email" type="email" defaultValue="emma@company.com" />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="birth-year">Ano de nascimento</FieldLabel>
                            <Input id="birth-year" name="birthYear" type="number" defaultValue="1990" />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="role">Função</FieldLabel>
                            <Input id="role" value="Gerente sênior" disabled readOnly />
                            <FieldDescription>Funções só podem ser alteradas por administradores.</FieldDescription>
                        </Field>
                    </FieldGroup>
                </FormSection>

                <Separator />

                <FormSection title="Configurações do workspace" description="Defina como este espaço aparece para sua equipe.">
                    <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
                        <Field>
                            <FieldLabel htmlFor="workspace-name">Nome do workspace</FieldLabel>
                            <Input id="workspace-name" name="workspaceName" defaultValue="Workspace de teste" />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="visibility">Visibilidade</FieldLabel>
                            <Select id="visibility" name="visibility" defaultValue="private">
                                <option value="private">Privado</option>
                                <option value="team">Somente equipe</option>
                                <option value="public">Público</option>
                            </Select>
                        </Field>
                        <Field className="sm:col-span-2">
                            <FieldLabel htmlFor="description">Descrição do workspace</FieldLabel>
                            <Textarea id="description" name="description" />
                            <FieldDescription>Esta descrição não será exibida externamente.</FieldDescription>
                        </Field>
                    </FieldGroup>
                </FormSection>

                <Separator />

                <FormSection title="Notificações" description="Escolha quais alertas você deseja receber.">
                    <fieldset className="space-y-4">
                        <legend className="text-sm font-medium">Equipe</legend>
                        <Preference id="join-requests" label="Solicitações para entrar na equipe" defaultChecked />
                        <Preference id="weekly-digest" label="Resumo semanal de atividades" />
                        <Preference id="security-alerts" label="Alertas de segurança" defaultChecked />
                    </fieldset>
                </FormSection>

                <div className="flex flex-col-reverse gap-2 border-t py-5 sm:flex-row sm:justify-end">
                    <Button type="reset" variant="outline">Descartar</Button>
                    <Button type="submit">Salvar alterações</Button>
                </div>
            </form>
        </main>
    );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <section className="grid gap-6 py-8 md:grid-cols-[minmax(0,190px)_minmax(0,1fr)] md:gap-12">
            <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-muted-foreground mt-1 text-sm leading-6">{description}</p>
            </div>
            <div>{children}</div>
        </section>
    );
}

function Preference({ id, label, defaultChecked = false }: { id: string; label: string; defaultChecked?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <Checkbox id={id} name={id} defaultChecked={defaultChecked} />
            <FieldLabel htmlFor={id} className="font-normal">{label}</FieldLabel>
        </div>
    );
}

FormsPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Design system' }, { title: 'Formulários' }]}>{page}</DashboardLayout>
);

export default FormsPage;