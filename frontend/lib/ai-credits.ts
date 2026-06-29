import { supabaseBrowser } from "@/lib/supabase-browser";

const CREDIT_COSTS: Record<string, number> = {
  career_iq: 5,
  cv_intelligence: 5,
  interview_iq: 5,
  employer_ai: 10,
  institution_ai: 20,
  admin_ai: 15,
  copilot: 5,
};

export async function getUserAiWallet() {
  const {
    data: { user },
  } = await supabaseBrowser.auth.getUser();

  if (!user) {
    return { user: null, wallet: null, error: "not_authenticated" };
  }

  let { data: wallet, error } = await supabaseBrowser
    .from("ai_credit_wallets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { user, wallet: null, error: error.message };
  }

  if (!wallet) {
    const { data: createdWallet, error: createError } = await supabaseBrowser
      .from("ai_credit_wallets")
      .insert({
        user_id: user.id,
        balance: 0,
        lifetime_credits: 0,
      })
      .select("*")
      .single();

    if (createError) {
      return { user, wallet: null, error: createError.message };
    }

    wallet = createdWallet;
  }

  return { user, wallet, error: null };
}

export async function hasEnoughCredits(toolName: string) {
  const cost = CREDIT_COSTS[toolName] || 1;
  const { user, wallet, error } = await getUserAiWallet();

  if (error || !user || !wallet) {
    return {
      allowed: false,
      cost,
      balance: 0,
      message: "Please log in and activate a subscription to use AI tools.",
    };
  }

  if (Number(wallet.balance || 0) < cost) {
    return {
      allowed: false,
      cost,
      balance: Number(wallet.balance || 0),
      message: `Insufficient AI credits. This action requires ${cost} credits.`,
    };
  }

  return {
    allowed: true,
    cost,
    balance: Number(wallet.balance || 0),
    message: "",
  };
}

export async function deductAiCredits({
  toolName,
  action,
  requestSummary,
}: {
  toolName: string;
  action?: string;
  requestSummary?: string;
}) {
  const cost = CREDIT_COSTS[toolName] || 1;
  const { user, wallet, error } = await getUserAiWallet();

  if (error || !user || !wallet) {
    return { success: false, error: error || "Wallet not found." };
  }

  const currentBalance = Number(wallet.balance || 0);

  if (currentBalance < cost) {
    return {
      success: false,
      error: `Insufficient AI credits. Required: ${cost}, Available: ${currentBalance}`,
    };
  }

  const newBalance = currentBalance - cost;

  const { error: walletError } = await supabaseBrowser
    .from("ai_credit_wallets")
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wallet.id);

  if (walletError) {
    return { success: false, error: walletError.message };
  }

  await supabaseBrowser.from("ai_credit_transactions").insert({
    wallet_id: wallet.id,
    user_id: user.id,
    transaction_type: "debit",
    amount: cost,
    balance_after: newBalance,
    source: toolName,
    description: `${cost} credits used for ${toolName}`,
    metadata: {
      action,
      request_summary: requestSummary,
    },
  });

  await supabaseBrowser.from("ai_usage_logs").insert({
    user_id: user.id,
    tool_name: toolName,
    action,
    credits_used: cost,
    request_summary: requestSummary,
    response_status: "success",
  });

  return {
    success: true,
    cost,
    balance_after: newBalance,
  };
}