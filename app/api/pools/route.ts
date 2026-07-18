import { NextResponse } from "next/server";
import { getPoolCatalog } from "../../../lib/catalog-data";
import {
  asCatalogChain,
  asDexProject,
  CATALOG_CHAINS,
  DEX_PROJECTS,
  type CatalogApiError,
  type CatalogFilters,
} from "../../../lib/catalog-types";

export const dynamic = "force-dynamic";

class CatalogQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogQueryError";
  }
}

function singleValue(
  searchParams: URLSearchParams,
  key: string,
): string | null {
  const values = searchParams.getAll(key);
  if (values.length > 1) {
    throw new CatalogQueryError(`Le paramètre "${key}" ne peut être répété.`);
  }

  const value = values[0]?.trim();
  return value ? value : null;
}

function parseFilters(searchParams: URLSearchParams): CatalogFilters {
  const id = singleValue(searchParams, "id");
  const rawChain = singleValue(searchParams, "chain");
  const rawProject = singleValue(searchParams, "project");

  if (id && id.length > 200) {
    throw new CatalogQueryError(
      'Le paramètre "id" ne peut pas dépasser 200 caractères.',
    );
  }

  const chain = rawChain ? asCatalogChain(rawChain) : null;
  if (rawChain && !chain) {
    throw new CatalogQueryError(
      `Chaîne inconnue. Valeurs admises : ${CATALOG_CHAINS.join(", ")}.`,
    );
  }

  const project = rawProject ? asDexProject(rawProject) : null;
  if (rawProject && !project) {
    throw new CatalogQueryError(
      `DEX inconnu. Valeurs admises : ${DEX_PROJECTS.join(", ")}.`,
    );
  }

  return {
    ...(id ? { id } : {}),
    ...(chain ? { chain } : {}),
    ...(project ? { project } : {}),
  };
}

function errorResponse(
  status: number,
  code: string,
  message: string,
): NextResponse<CatalogApiError> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function GET(request: Request) {
  let filters: CatalogFilters;

  try {
    filters = parseFilters(new URL(request.url).searchParams);
  } catch (error) {
    if (error instanceof CatalogQueryError) {
      return errorResponse(400, "INVALID_CATALOG_FILTER", error.message);
    }
    throw error;
  }

  try {
    const catalog = await getPoolCatalog(filters);

    return NextResponse.json(catalog, {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Pool catalog unavailable", error);
    return errorResponse(
      503,
      "POOL_CATALOG_UNAVAILABLE",
      "Le catalogue multi-chain est temporairement indisponible.",
    );
  }
}
