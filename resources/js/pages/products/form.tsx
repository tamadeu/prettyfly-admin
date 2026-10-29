import { Link, useForm } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRoute } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { slugify } from '@/lib/slug';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layout/dashboard';

interface Brand {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
}

interface Variant {
    id?: number;
    name: string;
    attributes: Specification[];
    sku: string;
    price: string;
    stock: string;
    weight: string;
    width: string;
    height: string;
    length: string;
    images: File[];
    image_order: string[];
    remove_image_ids: number[];
}

interface Specification {
    name: string;
    value: string;
}

interface ProductImage {
    id: number;
    url: string;
    alt: string | null;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    short_description: string | null;
    category_id: number | null;
    brand_id: number | null;
    is_visible: boolean;
    is_active: boolean;
    images: ProductImage[];
    variants: Array<
        Omit<
            Variant,
            'stock' | 'images' | 'image_order' | 'remove_image_ids'
        > & {
            stock: number;
            images: ProductImage[];
        }
    >;
    specifications: Specification[];
}

interface ProductFormData {
    name: string;
    slug: string;
    description: string;
    short_description: string;
    category_id: string;
    brand_id: string;
    is_visible: boolean;
    is_active: boolean;
    product_images: File[];
    product_image_order: string[];
    remove_product_image_ids: number[];
    variants: Variant[];
    specifications: Specification[];
}

const emptyVariant = (): Variant => ({
    name: '',
    attributes: [],
    sku: '',
    price: '',
    stock: '0',
    weight: '',
    width: '',
    height: '',
    length: '',
    images: [],
    image_order: [],
    remove_image_ids: [],
});

function ProductFormPage({
    product,
    categories,
    brands,
}: {
    product: Product | null;
    categories: Category[];
    brands: Brand[];
}) {
    const route = useRoute();
    const isEditing = product !== null;
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'variants'>(
        'details',
    );
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const { data, setData, post, transform, processing, errors } =
        useForm<ProductFormData>({
            name: product?.name ?? '',
            slug: product?.slug ?? '',
            description: product?.description ?? '',
            short_description: product?.short_description ?? '',
            category_id: product?.category_id
                ? String(product.category_id)
                : '',
            brand_id: product?.brand_id ? String(product.brand_id) : '',
            is_visible: product?.is_visible ?? false,
            is_active: product?.is_active ?? true,
            product_images: [],
            product_image_order:
                product?.images.map((image) => `existing:${image.id}`) ?? [],
            remove_product_image_ids: [],
            variants: product?.variants.map((variant) => ({
                ...variant,
                attributes: variant.attributes ?? [],
                stock: String(variant.stock),
                weight: variant.weight ?? '',
                width: variant.width ?? '',
                height: variant.height ?? '',
                length: variant.length ?? '',
                images: [],
                image_order:
                    variant.images?.map((image) => `existing:${image.id}`) ??
                    [],
                remove_image_ids: [],
            })) ?? [emptyVariant()],
            specifications: product?.specifications ?? [],
        });

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () =>
                toast.success(
                    isEditing ? 'Produto atualizado' : 'Produto criado',
                ),
            onError: (validationErrors: Record<string, string>) => {
                const hasVariantErrors = Object.keys(validationErrors).some(
                    (key) => key === 'variants' || key.startsWith('variants.'),
                );
                setActiveTab(hasVariantErrors ? 'variants' : 'details');
            },
        };

        if (isEditing) {
            transform((formData) => ({ ...formData, _method: 'put' }));
            post(route('produtos.update', product.id), {
                ...options,
                forceFormData: true,
            });
            return;
        }

        post(route('produtos.store'), options);
    }

    function updateVariant(index: number, field: keyof Variant, value: string) {
        setData(
            'variants',
            data.variants.map((variant, variantIndex) =>
                variantIndex === index
                    ? { ...variant, [field]: value }
                    : variant,
            ),
        );
    }

    function updateVariantFiles(
        index: number,
        files: File[],
        imageOrder: string[],
    ) {
        setData(
            'variants',
            data.variants.map((variant, variantIndex) =>
                variantIndex === index
                    ? { ...variant, images: files, image_order: imageOrder }
                    : variant,
            ),
        );
    }

    function updateVariantImageOrder(index: number, imageOrder: string[]) {
        setData(
            'variants',
            data.variants.map((variant, variantIndex) =>
                variantIndex === index
                    ? { ...variant, image_order: imageOrder }
                    : variant,
            ),
        );
    }

    function removeExistingVariantImage(variantIndex: number, imageId: number) {
        setData(
            'variants',
            data.variants.map((variant, currentIndex) =>
                currentIndex === variantIndex
                    ? {
                          ...variant,
                          remove_image_ids: [
                              ...variant.remove_image_ids,
                              imageId,
                          ],
                          image_order: variant.image_order.filter(
                              (item) => item !== `existing:${imageId}`,
                          ),
                      }
                    : variant,
            ),
        );
    }

    function updateVariantAttribute(
        variantIndex: number,
        attributeIndex: number,
        field: keyof Specification,
        value: string,
    ) {
        setData(
            'variants',
            data.variants.map((variant, currentVariantIndex) =>
                currentVariantIndex === variantIndex
                    ? {
                          ...variant,
                          attributes: variant.attributes.map(
                              (attribute, currentAttributeIndex) =>
                                  currentAttributeIndex === attributeIndex
                                      ? { ...attribute, [field]: value }
                                      : attribute,
                          ),
                      }
                    : variant,
            ),
        );
    }

    function updateSpecification(
        index: number,
        field: keyof Specification,
        value: string,
    ) {
        setData(
            'specifications',
            data.specifications.map((specification, specificationIndex) =>
                specificationIndex === index
                    ? { ...specification, [field]: value }
                    : specification,
            ),
        );
    }

    function fieldError(key: string) {
        return errors[key as keyof typeof errors];
    }

    function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
        const currentIndex = activeTab === 'details' ? 0 : 1;
        let nextIndex: number | null = null;

        if (event.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % 2;
        } else if (event.key === 'ArrowLeft') {
            nextIndex = (currentIndex + 1) % 2;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = 1;
        }

        if (nextIndex !== null) {
            event.preventDefault();
            setActiveTab(nextIndex === 0 ? 'details' : 'variants');
            tabRefs.current[nextIndex]?.focus();
        }
    }

    return (
        <main className="mx-auto w-full max-w-5xl space-y-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">
                    Catálogo
                </p>
                <h1 className="text-2xl font-semibold">
                    {isEditing ? 'Editar produto' : 'Novo produto'}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Cadastre os dados do catálogo, especificações e SKUs de cada
                    variação.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div
                    role="tablist"
                    aria-label="Seções do produto"
                    className="flex gap-1 border-b"
                >
                    <button
                        ref={(element) => {
                            tabRefs.current[0] = element;
                        }}
                        id="product-details-tab"
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'details'}
                        aria-controls="product-details-panel"
                        tabIndex={activeTab === 'details' ? 0 : -1}
                        onClick={() => setActiveTab('details')}
                        onKeyDown={handleTabKeyDown}
                        className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            activeTab === 'details'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Dados do produto
                    </button>
                    <button
                        ref={(element) => {
                            tabRefs.current[1] = element;
                        }}
                        id="product-variants-tab"
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'variants'}
                        aria-controls="product-variants-panel"
                        tabIndex={activeTab === 'variants' ? 0 : -1}
                        onClick={() => setActiveTab('variants')}
                        onKeyDown={handleTabKeyDown}
                        className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            activeTab === 'variants'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Variações e SKUs
                    </button>
                </div>

                <div
                    id="product-details-panel"
                    role="tabpanel"
                    aria-labelledby="product-details-tab"
                    tabIndex={0}
                    hidden={activeTab !== 'details'}
                    className="grid items-start gap-5 lg:grid-cols-4"
                >
                    <div className="space-y-5 lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <div>
                                    <CardTitle>Informações gerais</CardTitle>
                                    <CardDescription>
                                        Identificação, categoria e conteúdo do
                                        produto.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-5">
                                <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
                                    <Field data-invalid={Boolean(errors.name)}>
                                        <FieldLabel htmlFor="product-name">
                                            Nome do produto
                                        </FieldLabel>
                                        <Input
                                            id="product-name"
                                            value={data.name}
                                            onChange={(event) => {
                                                const name = event.target.value;
                                                setData((current) => ({
                                                    ...current,
                                                    name,
                                                    ...(!slugManuallyEdited
                                                        ? {
                                                              slug: slugify(
                                                                  name,
                                                              ),
                                                          }
                                                        : {}),
                                                }));
                                            }}
                                            aria-invalid={Boolean(errors.name)}
                                            autoFocus
                                        />
                                        <FieldError>{errors.name}</FieldError>
                                    </Field>
                                    <Field data-invalid={Boolean(errors.slug)}>
                                        <FieldLabel htmlFor="product-slug">
                                            Slug
                                        </FieldLabel>
                                        <Input
                                            id="product-slug"
                                            value={data.slug}
                                            onChange={(event) => {
                                                setSlugManuallyEdited(true);
                                                setData(
                                                    'slug',
                                                    event.target.value,
                                                );
                                            }}
                                            aria-invalid={Boolean(errors.slug)}
                                            placeholder="nome-do-produto"
                                        />
                                        <FieldDescription>
                                            Gerado pelo nome. Você também pode
                                            personalizá-lo; acentos e espaços
                                            viram hífens.
                                        </FieldDescription>
                                        <FieldError>{errors.slug}</FieldError>
                                    </Field>
                                    <Field
                                        data-invalid={Boolean(
                                            errors.category_id,
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <FieldLabel htmlFor="product-category">
                                                Categoria
                                            </FieldLabel>
                                            <Link
                                                href={route('categorias.index')}
                                                className="text-primary text-xs underline underline-offset-4"
                                            >
                                                Gerenciar categorias
                                            </Link>
                                        </div>
                                        <Select
                                            id="product-category"
                                            value={data.category_id}
                                            onChange={(event) =>
                                                setData(
                                                    'category_id',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                errors.category_id,
                                            )}
                                        >
                                            <option value="">
                                                Sem categoria
                                            </option>
                                            {categories.map((category) => (
                                                <option
                                                    key={category.id}
                                                    value={category.id}
                                                >
                                                    {category.name}
                                                </option>
                                            ))}
                                        </Select>
                                        <FieldError>
                                            {errors.category_id}
                                        </FieldError>
                                    </Field>
                                    <Field data-invalid={Boolean(errors.brand_id)}>
                                        <div className="flex items-center justify-between gap-2">
                                            <FieldLabel htmlFor="product-brand">Marca</FieldLabel>
                                            <Link
                                                href={route('marcas.index')}
                                                className="text-primary text-xs underline underline-offset-4"
                                            >
                                                Gerenciar marcas
                                            </Link>
                                        </div>
                                        <Select
                                            id="product-brand"
                                            value={data.brand_id}
                                            onChange={(event) => setData('brand_id', event.target.value)}
                                            aria-invalid={Boolean(errors.brand_id)}
                                        >
                                            <option value="">Sem marca</option>
                                            {brands.map((brand) => (
                                                <option key={brand.id} value={brand.id}>
                                                    {brand.name}
                                                </option>
                                            ))}
                                        </Select>
                                        <FieldError>{errors.brand_id}</FieldError>
                                    </Field>
                                    <Field
                                        className="sm:col-span-2"
                                        data-invalid={Boolean(errors.short_description)}
                                    >
                                        <FieldLabel htmlFor="product-short-description">
                                            Descrição curta
                                        </FieldLabel>
                                        <Textarea
                                            id="product-short-description"
                                            value={data.short_description}
                                            onChange={(event) => setData('short_description', event.target.value)}
                                            aria-invalid={Boolean(errors.short_description)}
                                            rows={3}
                                            maxLength={1000}
                                        />
                                        <FieldDescription>
                                            Texto breve exibido ao lado das fotos, logo abaixo do preço. Vazio usa a descrição completa.
                                        </FieldDescription>
                                        <FieldError>{errors.short_description}</FieldError>
                                    </Field>
                                    <Field
                                        className="sm:col-span-2"
                                        data-invalid={Boolean(
                                            errors.description,
                                        )}
                                    >
                                        <FieldLabel htmlFor="product-description">
                                            Descrição completa
                                        </FieldLabel>
                                        <Textarea
                                            id="product-description"
                                            value={data.description}
                                            onChange={(event) =>
                                                setData(
                                                    'description',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                errors.description,
                                            )}
                                            rows={5}
                                        />
                                        <FieldDescription>
                                            Exibida na aba “Descrição”, mais abaixo na página do produto.
                                        </FieldDescription>
                                        <FieldError>
                                            {errors.description}
                                        </FieldError>
                                    </Field>
                                </FieldGroup>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div>
                                    <CardTitle>Imagens do produto</CardTitle>
                                    <CardDescription>
                                        Fotos gerais exibidas na página do
                                        produto. Você pode enviar até 10
                                        imagens.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-5">
                                <ImageCollectionEditor
                                    label="Adicionar imagens do produto"
                                    existingImages={product?.images ?? []}
                                    removedImageIds={
                                        data.remove_product_image_ids
                                    }
                                    files={data.product_images}
                                    imageOrder={data.product_image_order}
                                    onFilesChange={(files, imageOrder) => {
                                        setData('product_images', files);
                                        setData(
                                            'product_image_order',
                                            imageOrder,
                                        );
                                    }}
                                    onImageOrderChange={(imageOrder) =>
                                        setData(
                                            'product_image_order',
                                            imageOrder,
                                        )
                                    }
                                    onRemoveExisting={(imageId) => {
                                        setData('remove_product_image_ids', [
                                            ...data.remove_product_image_ids,
                                            imageId,
                                        ]);
                                        setData(
                                            'product_image_order',
                                            data.product_image_order.filter(
                                                (item) =>
                                                    item !==
                                                    `existing:${imageId}`,
                                            ),
                                        );
                                    }}
                                    error={errors.product_images}
                                    itemError={(index) =>
                                        fieldError(`product_images.${index}`)
                                    }
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-5 lg:col-span-1">
                        <Card>
                            <CardHeader className="flex-col gap-3">
                                <div>
                                    <CardTitle>Publicação</CardTitle>
                                    <CardDescription>
                                        Atividade interna e visibilidade na loja
                                        são controles independentes.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-5">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="product-active"
                                        checked={data.is_active}
                                        onChange={(event) =>
                                            setData(
                                                'is_active',
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    <div className="space-y-1">
                                        <FieldLabel htmlFor="product-active">
                                            Produto ativo
                                        </FieldLabel>
                                        <FieldDescription>
                                            Produtos inativos não devem ser
                                            usados em operações da loja.
                                        </FieldDescription>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="product-visible"
                                        checked={data.is_visible}
                                        onChange={(event) =>
                                            setData(
                                                'is_visible',
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    <div className="space-y-1">
                                        <FieldLabel htmlFor="product-visible">
                                            Visível no site
                                        </FieldLabel>
                                        <FieldDescription>
                                            Quando desativado, o produto não
                                            aparece no catálogo da loja.
                                        </FieldDescription>
                                    </div>
                                </div>
                                {(errors.is_active || errors.is_visible) && (
                                    <FieldError>
                                        {errors.is_active ?? errors.is_visible}
                                    </FieldError>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div>
                                    <CardTitle>Especificações</CardTitle>
                                    <CardDescription>
                                        Adicione características como material,
                                        marca, composição ou modelo.
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="self-start"
                                    onClick={() =>
                                        setData('specifications', [
                                            ...data.specifications,
                                            { name: '', value: '' },
                                        ])
                                    }
                                >
                                    <Plus /> Adicionar
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-5">
                                {data.specifications.length === 0 && (
                                    <p className="text-muted-foreground text-sm">
                                        Nenhuma especificação adicionada.
                                    </p>
                                )}
                                {data.specifications.map(
                                    (specification, index) => (
                                        <div key={index} className="grid gap-3">
                                            <Field
                                                data-invalid={Boolean(
                                                    fieldError(
                                                        `specifications.${index}.name`,
                                                    ),
                                                )}
                                            >
                                                <FieldLabel
                                                    htmlFor={`specification-name-${index}`}
                                                >
                                                    Característica
                                                </FieldLabel>
                                                <Input
                                                    id={`specification-name-${index}`}
                                                    value={specification.name}
                                                    onChange={(event) =>
                                                        updateSpecification(
                                                            index,
                                                            'name',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Ex.: Material"
                                                    aria-invalid={Boolean(
                                                        fieldError(
                                                            `specifications.${index}.name`,
                                                        ),
                                                    )}
                                                />
                                                <FieldError>
                                                    {fieldError(
                                                        `specifications.${index}.name`,
                                                    )}
                                                </FieldError>
                                            </Field>
                                            <Field
                                                data-invalid={Boolean(
                                                    fieldError(
                                                        `specifications.${index}.value`,
                                                    ),
                                                )}
                                            >
                                                <FieldLabel
                                                    htmlFor={`specification-value-${index}`}
                                                >
                                                    Valor
                                                </FieldLabel>
                                                <Input
                                                    id={`specification-value-${index}`}
                                                    value={specification.value}
                                                    onChange={(event) =>
                                                        updateSpecification(
                                                            index,
                                                            'value',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Ex.: Algodão"
                                                    aria-invalid={Boolean(
                                                        fieldError(
                                                            `specifications.${index}.value`,
                                                        ),
                                                    )}
                                                />
                                                <FieldError>
                                                    {fieldError(
                                                        `specifications.${index}.value`,
                                                    )}
                                                </FieldError>
                                            </Field>
                                            <div className="flex items-end">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Remover especificação ${index + 1}`}
                                                    onClick={() =>
                                                        setData(
                                                            'specifications',
                                                            data.specifications.filter(
                                                                (
                                                                    _,
                                                                    itemIndex,
                                                                ) =>
                                                                    itemIndex !==
                                                                    index,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        </div>
                                    ),
                                )}
                                {errors.specifications && (
                                    <FieldError>
                                        {errors.specifications}
                                    </FieldError>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div
                    id="product-variants-panel"
                    role="tabpanel"
                    aria-labelledby="product-variants-tab"
                    tabIndex={0}
                    hidden={activeTab !== 'variants'}
                    className="space-y-5"
                >
                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle>Variações e SKUs</CardTitle>
                                <CardDescription>
                                    Cada variação tem SKU, preço, estoque e
                                    dimensões de envio próprios.
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setData('variants', [
                                        ...data.variants,
                                        emptyVariant(),
                                    ])
                                }
                            >
                                <Plus /> Adicionar variação
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-5">
                            {data.variants.map((variant, index) => (
                                <section
                                    key={variant.id ?? `new-${index}`}
                                    className="space-y-4 rounded-lg border p-4"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-sm font-semibold">
                                            Variação {index + 1}
                                        </h3>
                                        {data.variants.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setData(
                                                        'variants',
                                                        data.variants.filter(
                                                            (_, itemIndex) =>
                                                                itemIndex !==
                                                                index,
                                                        ),
                                                    )
                                                }
                                            >
                                                <Trash2 /> Remover
                                            </Button>
                                        )}
                                    </div>
                                    {variant.id && (
                                        <input
                                            type="hidden"
                                            name={`variants[${index}][id]`}
                                            value={variant.id}
                                        />
                                    )}
                                    <FieldGroup className="gap-4 sm:grid sm:grid-cols-2">
                                        <VariantField
                                            id={`variant-name-${index}`}
                                            label="Identificação"
                                            placeholder="Ex.: Azul / tamanho M"
                                            value={variant.name}
                                            error={fieldError(
                                                `variants.${index}.name`,
                                            )}
                                            onChange={(value) =>
                                                updateVariant(
                                                    index,
                                                    'name',
                                                    value,
                                                )
                                            }
                                        />
                                        <VariantField
                                            id={`variant-sku-${index}`}
                                            label="SKU"
                                            value={variant.sku}
                                            error={fieldError(
                                                `variants.${index}.sku`,
                                            )}
                                            onChange={(value) =>
                                                updateVariant(
                                                    index,
                                                    'sku',
                                                    value,
                                                )
                                            }
                                        />
                                        <VariantField
                                            id={`variant-price-${index}`}
                                            label="Preço (R$)"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={variant.price}
                                            error={fieldError(
                                                `variants.${index}.price`,
                                            )}
                                            onChange={(value) =>
                                                updateVariant(
                                                    index,
                                                    'price',
                                                    value,
                                                )
                                            }
                                        />
                                        <VariantField
                                            id={`variant-stock-${index}`}
                                            label="Estoque"
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={variant.stock}
                                            error={fieldError(
                                                `variants.${index}.stock`,
                                            )}
                                            onChange={(value) =>
                                                updateVariant(
                                                    index,
                                                    'stock',
                                                    value,
                                                )
                                            }
                                        />
                                    </FieldGroup>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h4 className="text-sm font-medium">
                                                    Atributos da variação
                                                </h4>
                                                <p className="text-muted-foreground mt-1 text-xs">
                                                    Ex.: Cor = Azul, Tamanho =
                                                    M.
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setData(
                                                        'variants',
                                                        data.variants.map(
                                                            (
                                                                item,
                                                                itemIndex,
                                                            ) =>
                                                                itemIndex ===
                                                                index
                                                                    ? {
                                                                          ...item,
                                                                          attributes:
                                                                              [
                                                                                  ...item.attributes,
                                                                                  {
                                                                                      name: '',
                                                                                      value: '',
                                                                                  },
                                                                              ],
                                                                      }
                                                                    : item,
                                                        ),
                                                    )
                                                }
                                            >
                                                <Plus /> Adicionar atributo
                                            </Button>
                                        </div>
                                        {variant.attributes.map(
                                            (attribute, attributeIndex) => (
                                                <div
                                                    key={attributeIndex}
                                                    className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                                                >
                                                    <Field
                                                        data-invalid={Boolean(
                                                            fieldError(
                                                                `variants.${index}.attributes.${attributeIndex}.name`,
                                                            ),
                                                        )}
                                                    >
                                                        <FieldLabel
                                                            htmlFor={`variant-${index}-attribute-name-${attributeIndex}`}
                                                        >
                                                            Atributo
                                                        </FieldLabel>
                                                        <Input
                                                            id={`variant-${index}-attribute-name-${attributeIndex}`}
                                                            value={
                                                                attribute.name
                                                            }
                                                            onChange={(event) =>
                                                                updateVariantAttribute(
                                                                    index,
                                                                    attributeIndex,
                                                                    'name',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Cor"
                                                            aria-invalid={Boolean(
                                                                fieldError(
                                                                    `variants.${index}.attributes.${attributeIndex}.name`,
                                                                ),
                                                            )}
                                                        />
                                                        <FieldError>
                                                            {fieldError(
                                                                `variants.${index}.attributes.${attributeIndex}.name`,
                                                            )}
                                                        </FieldError>
                                                    </Field>
                                                    <Field
                                                        data-invalid={Boolean(
                                                            fieldError(
                                                                `variants.${index}.attributes.${attributeIndex}.value`,
                                                            ),
                                                        )}
                                                    >
                                                        <FieldLabel
                                                            htmlFor={`variant-${index}-attribute-value-${attributeIndex}`}
                                                        >
                                                            Valor
                                                        </FieldLabel>
                                                        <Input
                                                            id={`variant-${index}-attribute-value-${attributeIndex}`}
                                                            value={
                                                                attribute.value
                                                            }
                                                            onChange={(event) =>
                                                                updateVariantAttribute(
                                                                    index,
                                                                    attributeIndex,
                                                                    'value',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Azul"
                                                            aria-invalid={Boolean(
                                                                fieldError(
                                                                    `variants.${index}.attributes.${attributeIndex}.value`,
                                                                ),
                                                            )}
                                                        />
                                                        <FieldError>
                                                            {fieldError(
                                                                `variants.${index}.attributes.${attributeIndex}.value`,
                                                            )}
                                                        </FieldError>
                                                    </Field>
                                                    <div className="flex items-end">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={`Remover atributo ${attributeIndex + 1} da variação ${index + 1}`}
                                                            onClick={() =>
                                                                setData(
                                                                    'variants',
                                                                    data.variants.map(
                                                                        (
                                                                            item,
                                                                            itemIndex,
                                                                        ) =>
                                                                            itemIndex ===
                                                                            index
                                                                                ? {
                                                                                      ...item,
                                                                                      attributes:
                                                                                          item.attributes.filter(
                                                                                              (
                                                                                                  _,
                                                                                                  attributeItemIndex,
                                                                                              ) =>
                                                                                                  attributeItemIndex !==
                                                                                                  attributeIndex,
                                                                                          ),
                                                                                  }
                                                                                : item,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            <Trash2 />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="mb-3 text-sm font-medium">
                                            Logística da variação
                                        </h4>
                                        <FieldGroup className="gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                                            <VariantField
                                                id={`variant-weight-${index}`}
                                                label="Peso (kg)"
                                                type="number"
                                                min="0.001"
                                                step="0.001"
                                                value={variant.weight}
                                                error={fieldError(
                                                    `variants.${index}.weight`,
                                                )}
                                                onChange={(value) =>
                                                    updateVariant(
                                                        index,
                                                        'weight',
                                                        value,
                                                    )
                                                }
                                            />
                                            <VariantField
                                                id={`variant-width-${index}`}
                                                label="Largura (cm)"
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={variant.width}
                                                error={fieldError(
                                                    `variants.${index}.width`,
                                                )}
                                                onChange={(value) =>
                                                    updateVariant(
                                                        index,
                                                        'width',
                                                        value,
                                                    )
                                                }
                                            />
                                            <VariantField
                                                id={`variant-height-${index}`}
                                                label="Altura (cm)"
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={variant.height}
                                                error={fieldError(
                                                    `variants.${index}.height`,
                                                )}
                                                onChange={(value) =>
                                                    updateVariant(
                                                        index,
                                                        'height',
                                                        value,
                                                    )
                                                }
                                            />
                                            <VariantField
                                                id={`variant-length-${index}`}
                                                label="Comprimento (cm)"
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={variant.length}
                                                error={fieldError(
                                                    `variants.${index}.length`,
                                                )}
                                                onChange={(value) =>
                                                    updateVariant(
                                                        index,
                                                        'length',
                                                        value,
                                                    )
                                                }
                                            />
                                        </FieldGroup>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="text-sm font-medium">
                                                Fotos da variação
                                            </h4>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                Fotos específicas deste SKU, até
                                                10 imagens.
                                            </p>
                                        </div>
                                        <ImageCollectionEditor
                                            label={`Adicionar fotos da variação ${index + 1}`}
                                            existingImages={
                                                product?.variants.find(
                                                    (item) =>
                                                        item.id === variant.id,
                                                )?.images ?? []
                                            }
                                            removedImageIds={
                                                variant.remove_image_ids
                                            }
                                            files={variant.images}
                                            imageOrder={variant.image_order}
                                            onFilesChange={(
                                                files,
                                                imageOrder,
                                            ) =>
                                                updateVariantFiles(
                                                    index,
                                                    files,
                                                    imageOrder,
                                                )
                                            }
                                            onImageOrderChange={(imageOrder) =>
                                                updateVariantImageOrder(
                                                    index,
                                                    imageOrder,
                                                )
                                            }
                                            onRemoveExisting={(imageId) =>
                                                removeExistingVariantImage(
                                                    index,
                                                    imageId,
                                                )
                                            }
                                            error={fieldError(
                                                `variants.${index}.images`,
                                            )}
                                            itemError={(imageIndex) =>
                                                fieldError(
                                                    `variants.${index}.images.${imageIndex}`,
                                                )
                                            }
                                        />
                                    </div>
                                </section>
                            ))}
                            {errors.variants && (
                                <FieldError>{errors.variants}</FieldError>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button asChild variant="outline">
                        <Link href={route('produtos.index')}>Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing
                            ? 'Salvando...'
                            : isEditing
                              ? 'Salvar alterações'
                              : 'Criar produto'}
                    </Button>
                </div>
            </form>
        </main>
    );
}

function ImageCollectionEditor({
    label,
    existingImages,
    removedImageIds,
    files,
    imageOrder,
    onFilesChange,
    onImageOrderChange,
    onRemoveExisting,
    error,
    itemError,
}: {
    label: string;
    existingImages: ProductImage[];
    removedImageIds: number[];
    files: File[];
    imageOrder: string[];
    onFilesChange: (files: File[], imageOrder: string[]) => void;
    onImageOrderChange: (order: string[]) => void;
    onRemoveExisting: (imageId: number) => void;
    error?: string;
    itemError: (index: number) => string | undefined;
}) {
    const [previews, setPreviews] = useState<string[]>([]);
    const visibleImages = existingImages.filter(
        (image) => !removedImageIds.includes(image.id),
    );
    const displayedItems: Array<{
        token: string;
        image: ProductImage | null;
        file: File | null;
        fileIndex: number;
    }> = [];

    imageOrder.forEach((token) => {
        const [type, value] = token.split(':');

        if (type === 'existing') {
            const image = visibleImages.find(
                (item) => item.id === Number(value),
            );
            if (image) {
                displayedItems.push({
                    token,
                    image,
                    file: null,
                    fileIndex: -1,
                });
            }
            return;
        }

        if (type === 'new') {
            const fileIndex = Number(value);
            const file = files[fileIndex];
            if (file) {
                displayedItems.push({ token, image: null, file, fileIndex });
            }
        }
    });

    useEffect(() => {
        const urls = files.map((file) => URL.createObjectURL(file));
        setPreviews(urls);

        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [files]);

    return (
        <div className="space-y-4">
            <Field data-invalid={Boolean(error)}>
                <FieldLabel>{label}</FieldLabel>
                <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => {
                        const selectedFiles = Array.from(
                            event.target.files ?? [],
                        );
                        if (selectedFiles.length > 0) {
                            const startIndex = files.length;
                            const nextOrder = [
                                ...imageOrder,
                                ...selectedFiles.map(
                                    (_, index) => `new:${startIndex + index}`,
                                ),
                            ];
                            onFilesChange(
                                [...files, ...selectedFiles],
                                nextOrder,
                            );
                        }
                        event.target.value = '';
                    }}
                    aria-invalid={Boolean(error)}
                />
                <FieldDescription>
                    JPG, PNG ou WebP. Até 5 MB por imagem.
                </FieldDescription>
                <FieldError>{error}</FieldError>
            </Field>

            {displayedItems.length > 0 && (
                <div className="space-y-2">
                    <p className="text-muted-foreground text-xs">
                        Reordene as fotos; a primeira à esquerda será a imagem
                        principal.
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {displayedItems.map((item, index) => (
                            <div
                                key={item.token}
                                className="group relative overflow-hidden rounded-md border"
                            >
                                <img
                                    src={
                                        item.image?.url ??
                                        previews[item.fileIndex]
                                    }
                                    alt={
                                        item.image?.alt ??
                                        item.file?.name ??
                                        'Imagem do produto'
                                    }
                                    className="aspect-square w-full object-cover"
                                />
                                {index === 0 && (
                                    <Badge className="absolute top-2 left-2 shadow-sm">
                                        Principal
                                    </Badge>
                                )}
                                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
                                    <div className="flex gap-1">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="icon-sm"
                                            aria-label={`Mover imagem ${index + 1} para a esquerda`}
                                            disabled={index === 0}
                                            onClick={() => {
                                                const reordered = [
                                                    ...imageOrder,
                                                ];
                                                [
                                                    reordered[index - 1],
                                                    reordered[index],
                                                ] = [
                                                    reordered[index],
                                                    reordered[index - 1],
                                                ];
                                                onImageOrderChange(reordered);
                                            }}
                                        >
                                            <ChevronLeft />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="icon-sm"
                                            aria-label={`Mover imagem ${index + 1} para a direita`}
                                            disabled={
                                                index ===
                                                displayedItems.length - 1
                                            }
                                            onClick={() => {
                                                const reordered = [
                                                    ...imageOrder,
                                                ];
                                                [
                                                    reordered[index],
                                                    reordered[index + 1],
                                                ] = [
                                                    reordered[index + 1],
                                                    reordered[index],
                                                ];
                                                onImageOrderChange(reordered);
                                            }}
                                        >
                                            <ChevronRight />
                                        </Button>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon-sm"
                                        aria-label={`Remover imagem ${index + 1}`}
                                        onClick={() => {
                                            if (item.image) {
                                                onRemoveExisting(item.image.id);
                                                return;
                                            }

                                            const reordered = imageOrder
                                                .filter(
                                                    (token) =>
                                                        token !== item.token,
                                                )
                                                .map((token) => {
                                                    const [type, rawIndex] =
                                                        token.split(':');
                                                    const fileIndex =
                                                        Number(rawIndex);
                                                    return type === 'new' &&
                                                        fileIndex >
                                                            item.fileIndex
                                                        ? `new:${fileIndex - 1}`
                                                        : token;
                                                });
                                            onFilesChange(
                                                files.filter(
                                                    (_, fileIndex) =>
                                                        fileIndex !==
                                                        item.fileIndex,
                                                ),
                                                reordered,
                                            );
                                        }}
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                                {!item.image && itemError(item.fileIndex) && (
                                    <p
                                        role="alert"
                                        className="text-destructive p-2 text-xs"
                                    >
                                        {itemError(item.fileIndex)}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function VariantField({
    id,
    label,
    value,
    error,
    onChange,
    ...inputProps
}: {
    id: string;
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, 'id' | 'value' | 'onChange'>) {
    return (
        <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Input
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-invalid={Boolean(error)}
                {...inputProps}
            />
            <FieldError>{error}</FieldError>
        </Field>
    );
}

ProductFormPage.layout = (page: React.ReactNode) => {
    const props = (page as React.ReactElement<{ product: Product | null }>)
        .props;

    return (
        <DashboardLayout
            breadcrumb={[
                { title: 'Produtos', href: '/produtos' },
                { title: props.product ? 'Editar produto' : 'Novo produto' },
            ]}
        >
            {page}
        </DashboardLayout>
    );
};

export default ProductFormPage;
