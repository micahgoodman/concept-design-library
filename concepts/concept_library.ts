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

export class ConceptLibraryConcept {
    private concepts: Map<string, ConceptRecord> = new Map();
    private byOwner: Map<string, Set<string>> = new Map();

    createConcept(
        { concept, owner, title, description, content = "" }: {
            concept?: string;
            owner: string;
            title: string;
            description: string;
            content?: string;
        },
    ): { concept: string } {
        const id = concept ?? uuid();
        const rec: ConceptRecord = {
            concept: id,
            owner,
            title,
            description,
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.concepts.set(id, rec);
        if (!this.byOwner.has(owner)) this.byOwner.set(owner, new Set());
        this.byOwner.get(owner)!.add(id);
        return { concept: id };
    }

    deleteConcept({ concept }: { concept: string }): { concept: string } {
        const rec = this.concepts.get(concept);
        if (rec) {
            this.byOwner.get(rec.owner)?.delete(concept);
            this.concepts.delete(concept);
        }
        return { concept };
    }

    updateTitle(
        { concept, title }: { concept: string; title: string },
    ): { concept: string } {
        const rec = this.concepts.get(concept);
        if (rec) {
            rec.title = title;
            rec.updatedAt = new Date().toISOString();
        }
        return { concept };
    }

    updateDescription(
        { concept, description }: { concept: string; description: string },
    ): { concept: string } {
        const rec = this.concepts.get(concept);
        if (rec) {
            rec.description = description;
            rec.updatedAt = new Date().toISOString();
        }
        return { concept };
    }

    updateContent(
        { concept, content }: { concept: string; content: string },
    ): { concept: string } {
        const rec = this.concepts.get(concept);
        if (rec) {
            rec.content = content;
            rec.updatedAt = new Date().toISOString();
        }
        return { concept };
    }

    // Queries
    _get(
        { concept }: { concept: string },
    ): ConceptRecord[] {
        const rec = this.concepts.get(concept);
        return rec ? [{ ...rec }] : [];
    }

    _listAll(): ConceptRecord[] {
        return [...this.concepts.values()].map((r) => ({ ...r }));
    }

    _listByOwner(
        { owner }: { owner: string },
    ): { concept: string; title: string; createdAt: string; updatedAt: string }[] {
        const ids = this.byOwner.get(owner) ?? new Set();
        return [...ids].map((id) => {
            const r = this.concepts.get(id)!;
            return {
                concept: r.concept,
                title: r.title,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
            };
        });
    }

    _getPayload(
        { concept }: { concept: string },
    ): { payload: unknown }[] {
        const rec = this.concepts.get(concept);
        if (!rec) return [];
        return [{ payload: { ...rec } }];
    }

    _listAllPayload(): { payload: unknown }[] {
        const payload = this._listAll().sort((a, b) =>
            a.createdAt < b.createdAt ? 1 : -1
        );
        return [{ payload }];
    }
}
