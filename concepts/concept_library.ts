import { uuid } from "../engine/util.ts";

export interface ConceptRecord {
    concept: string;
    owner: string;
    title: string;
    description: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

function mapRowToConcept(r: any): ConceptRecord {
    return {
        concept: r.concept,
        owner: r.owner,
        title: r.title,
        description: r.description,
        content: r.content ?? "",
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

export class ConceptLibraryConcept {
    constructor(private sb: any) {}
    async createConcept(
        { concept, owner, title, description, content = "" }: {
            concept?: string;
            owner: string;
            title: string;
            description: string;
            content?: string;
        },
    ): Promise<{ concept: string }> {
        const id = concept ?? uuid();
        const now = new Date().toISOString();
        const { error } = await this.sb.from("concepts").insert([
            {
                concept: id,
                owner,
                title,
                description,
                content,
                created_at: now,
                updated_at: now,
            },
        ]);
        if (error) throw error;
        return { concept: id };
    }

    async deleteConcept({ concept }: { concept: string }): Promise<{ concept: string }> {
        const { error } = await this.sb.from("concepts").delete().eq("concept", concept);
        if (error) throw error;
        return { concept };
    }

    async updateTitle(
        { concept, title }: { concept: string; title: string },
    ): Promise<{ concept: string }> {
        const { error } = await this.sb.from("concepts").update({ title, updated_at: new Date().toISOString() }).eq("concept", concept);
        if (error) throw error;
        return { concept };
    }

    async updateDescription(
        { concept, description }: { concept: string; description: string },
    ): Promise<{ concept: string }> {
        const { error } = await this.sb.from("concepts").update({ description, updated_at: new Date().toISOString() }).eq("concept", concept);
        if (error) throw error;
        return { concept };
    }

    async updateContent(
        { concept, content }: { concept: string; content: string },
    ): Promise<{ concept: string }> {
        const { error } = await this.sb.from("concepts").update({ content, updated_at: new Date().toISOString() }).eq("concept", concept);
        if (error) throw error;
        return { concept };
    }

    // Queries
    async _get(
        { concept }: { concept: string },
    ): Promise<ConceptRecord[]> {
        const { data, error } = await this.sb.from("concepts").select("concept, owner, title, description, content, created_at, updated_at").eq("concept", concept).maybeSingle();
        if (error) throw error;
        return data ? [mapRowToConcept(data)] : [];
    }

    async _listAll(): Promise<ConceptRecord[]> {
        const { data, error } = await this.sb.from("concepts").select("concept, owner, title, description, content, created_at, updated_at");
        if (error) throw error;
        return (data ?? []).map(mapRowToConcept);
    }

    async _listByOwner(
        { owner }: { owner: string },
    ): Promise<{ concept: string; title: string; createdAt: string; updatedAt: string }[]> {
        const { data, error } = await this.sb
            .from("concepts")
            .select("concept, title, created_at, updated_at")
            .eq("owner", owner);
        if (error) throw error;
        return (data ?? []).map((r: any) => ({
            concept: r.concept,
            title: r.title,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
        }));
    }

    async _getPayload(
        { concept }: { concept: string },
    ): Promise<{ payload: unknown }[]> {
        const rows = await this._get({ concept });
        if (!rows.length) return [];
        return [{ payload: rows[0] }];
    }

    async _listAllPayload(): Promise<{ payload: unknown }[]> {
        const rows = await this._listAll();
        const payload = rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        return [{ payload }];
    }
}
