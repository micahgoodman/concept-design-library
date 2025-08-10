import { actions, Frames, Vars } from "../engine/mod.ts";
import { APIConcept } from "../concepts/api.ts";
import { ConceptLibraryConcept } from "../concepts/concept_library.ts";

// Synchronizations between generic API requests and concept design library behavior
export function makeApiConceptSyncs(API: APIConcept, Library: ConceptLibraryConcept) {
  // GET /concepts -> list all
  const ListConcepts = ({ request, payload }: Vars) => ({
    when: actions([API.request, { method: "GET", path: "/concepts" }, { request }]),
    where: (frames: Frames) => frames.query(Library._listAllPayload, {}, { payload }),
    then: actions([API.response, { request, output: payload }]),
  });

  // POST /concepts -> create
  const CreateConcept = ({ owner, title, description, content, request }: Vars) => ({
    when: actions([
      API.request,
      { method: "POST", path: "/concepts", owner, title, description, content },
      { request },
    ]),
    then: actions([Library.createConcept, { owner, title, description, content }]),
  });

  // POST /concepts -> respond with id
  const CreateConceptResponse = ({ owner, title, description, content, conceptId, request, payload }: Vars) => ({
    when: actions(
      [API.request, { method: "POST", path: "/concepts", owner, title, description, content }, { request }],
      [Library.createConcept, { owner, title, description, content }, { concept: conceptId }],
    ),
    where: (frames: Frames) =>
      frames.map((frame) => ({
        ...frame,
        [payload]: { concept: frame[conceptId] as string },
      })),
    then: actions([API.response, { request, output: payload }]),
  });

  // GET /concepts/:concept -> get one
  const GetConcept = ({ request, payload, conceptId }: Vars) => ({
    when: actions([API.request, { method: "GET", path: "/concepts/:concept", concept: conceptId }, { request }]),
    where: (frames: Frames) => frames.query(Library._getPayload, { concept: conceptId }, { payload }),
    then: actions([API.response, { request, output: payload }]),
  });

  // PATCH /concepts/:concept/title
  const UpdateTitle = ({ conceptId, title, request }: Vars) => ({
    when: actions([
      API.request,
      { method: "PATCH", path: "/concepts/:concept/title", concept: conceptId, title },
      { request },
    ]),
    then: actions([Library.updateTitle, { concept: conceptId, title }], [API.response, { request, output: { ok: true } }]),
  });

  // PATCH /concepts/:concept/description
  const UpdateDescription = ({ conceptId, description, request }: Vars) => ({
    when: actions([
      API.request,
      { method: "PATCH", path: "/concepts/:concept/description", concept: conceptId, description },
      { request },
    ]),
    then: actions(
      [Library.updateDescription, { concept: conceptId, description }],
      [API.response, { request, output: { ok: true } }],
    ),
  });

  // PATCH /concepts/:concept/content
  const UpdateContent = ({ conceptId, content, request }: Vars) => ({
    when: actions([
      API.request,
      { method: "PATCH", path: "/concepts/:concept/content", concept: conceptId, content },
      { request },
    ]),
    then: actions(
      [Library.updateContent, { concept: conceptId, content }],
      [API.response, { request, output: { ok: true } }],
    ),
  });

  // DELETE /concepts/:concept
  const DeleteConcept = ({ conceptId, request }: Vars) => ({
    when: actions([
      API.request,
      { method: "DELETE", path: "/concepts/:concept", concept: conceptId },
      { request },
    ]),
    then: actions([Library.deleteConcept, { concept: conceptId }], [API.response, { request, output: { ok: true } }]),
  });

  return {
    ListConcepts,
    CreateConcept,
    CreateConceptResponse,
    GetConcept,
    UpdateTitle,
    UpdateDescription,
    UpdateContent,
    DeleteConcept,
  };
}
