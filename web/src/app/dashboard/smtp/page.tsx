// src/app/dashboard/smtp/page.tsx

"use client";

import { useEffect, useState } from "react";

import {
    Plus,
    Server,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

type SmtpAccount = {
    id: string;
    name: string;
    host: string;
    port: number;
    fromName: string;
    fromEmail: string;
    isVerified: boolean;
};

type SmtpFormData = {
    name: string;
    host: string;
    port: number;
    username: string;
    password: string;
    encryptionType: string;
    fromEmail: string;
    fromName: string;
};

const initialFormData: SmtpFormData = {
    name: "",
    host: "",
    port: 465,
    username: "",
    password: "",
    encryptionType: "SSL",
    fromEmail: "",
    fromName: "",
};

export default function SmtpDashboard() {
    const [accounts, setAccounts] =
        useState<SmtpAccount[]>([]);

    const [isAdding, setIsAdding] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [formData, setFormData] =
        useState<SmtpFormData>(
            initialFormData
        );

    const fetchAccounts = async () => {
        try {
            const response = await fetch(
                "/api/smtp"
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Failed to fetch SMTP accounts"
                );
            }

            setAccounts(data.data || []);
        } catch (error) {
            console.error(
                "Fetch SMTP Accounts Error:",
                error
            );
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleChange = (
        e:
            | React.ChangeEvent<HTMLInputElement>
            | React.ChangeEvent<HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,

            [name]:
                name === "port"
                    ? Number(value)
                    : value,
        }));
    };

    const resetForm = () => {
        setFormData(initialFormData);
    };

    const handleAddSmtp = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                "/api/smtp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(
                        formData
                    ),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Failed to verify SMTP credentials"
                );
            }

            await fetchAccounts();

            resetForm();

            setIsAdding(false);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(
                    "Something went wrong"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl p-8">

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Sending Configurations
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage SMTP servers used for campaign delivery.
                    </p>
                </div>

                <button
                    onClick={() =>
                        setIsAdding(
                            !isAdding
                        )
                    }
                    className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add SMTP
                </button>
            </div>

            {/* Add SMTP Form */}
            {isAdding && (
                <form
                    onSubmit={
                        handleAddSmtp
                    }
                    className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <h2 className="mb-4 text-lg font-semibold">
                        New SMTP Connection
                    </h2>

                    {error && (
                        <div className="mb-4 flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        <input
                            required
                            name="name"
                            value={
                                formData.name
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Friendly Name"
                            className="rounded-md border p-2"
                        />

                        <input
                            required
                            name="host"
                            value={
                                formData.host
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="smtp.gmail.com"
                            className="rounded-md border p-2"
                        />

                        <input
                            required
                            type="number"
                            name="port"
                            value={
                                formData.port
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="465"
                            className="rounded-md border p-2"
                        />

                        <select
                            name="encryptionType"
                            value={
                                formData.encryptionType
                            }
                            onChange={
                                handleChange
                            }
                            className="rounded-md border p-2"
                        >
                            <option value="SSL">
                                SSL
                            </option>

                            <option value="TLS">
                                TLS
                            </option>

                            <option value="NONE">
                                None
                            </option>
                        </select>

                        <input
                            required
                            name="username"
                            value={
                                formData.username
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Username"
                            className="rounded-md border p-2"
                        />

                        <input
                            required
                            type="password"
                            name="password"
                            value={
                                formData.password
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Password / App Password"
                            className="rounded-md border p-2"
                        />

                        <input
                            required
                            type="email"
                            name="fromEmail"
                            value={
                                formData.fromEmail
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Sender Email"
                            className="rounded-md border p-2"
                        />

                        <input
                            required
                            name="fromName"
                            value={
                                formData.fromName
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Sender Name"
                            className="rounded-md border p-2"
                        />
                    </div>

                    <div className="mt-4 flex justify-end gap-2">

                        <button
                            type="button"
                            onClick={() => {
                                setIsAdding(
                                    false
                                );

                                resetForm();
                            }}
                            className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading
                                ? "Verifying..."
                                : "Connect & Save"}
                        </button>
                    </div>
                </form>
            )}

            {/* SMTP Accounts */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                {accounts.map((account) => (
                    <div
                        key={account.id}
                        className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                        <div className="mb-4 flex items-center justify-between">

                            <div className="flex items-center font-medium text-gray-900">
                                <Server className="mr-2 h-5 w-5 text-blue-600" />
                                {account.name}
                            </div>

                            {account.isVerified && (
                                <CheckCircle2
                                    className="h-5 w-5 text-green-500"
                                />
                            )}
                        </div>

                        <div className="flex-grow space-y-1 text-sm text-gray-500">
                            <p>
                                <strong>
                                    Host:
                                </strong>{" "}
                                {account.host}:
                                {account.port}
                            </p>

                            <p>
                                <strong>
                                    From:
                                </strong>{" "}
                                {
                                    account.fromName
                                }{" "}
                                &lt;
                                {
                                    account.fromEmail
                                }
                                &gt;
                            </p>
                        </div>
                    </div>
                ))}

                {accounts.length === 0 &&
                    !isAdding && (
                        <div className="col-span-3 rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-500">
                            No SMTP configurations found.
                        </div>
                    )}
            </div>
        </div>
    );
}