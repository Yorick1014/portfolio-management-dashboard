import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import App from "./App";
import { getCurrentUser } from "./api/auth";

const apiClientMock = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock("./api/auth", () => ({
  getCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

vi.mock("./api/client", () => ({
  apiClient: apiClientMock,
}));

describe("App auth routing", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    window.history.pushState({}, "", "/");
    vi.restoreAllMocks();
    apiClientMock.delete.mockReset();
    apiClientMock.get.mockReset();
    apiClientMock.post.mockReset();
    apiClientMock.put.mockReset();
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
      username: "demo",
    });
  });

  test("redirects unauthenticated dashboard visitors to login", async () => {
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    expect(
      await screen.findByRole("heading", {
        name: /sign in to your portfolio/i,
      }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
  });

  test("renders registration form with password confirmation", async () => {
    window.history.pushState({}, "", "/register");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  test("shows the professional sidebar layout to authenticated users", async () => {
    localStorage.setItem("portfolio_token", "test-token");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /portfolio overview/i }),
    ).toBeInTheDocument();
    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    expect(primaryNav).toBeInTheDocument();
    expect(
      within(primaryNav).getByRole("link", { name: /^dashboard$/i }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      within(primaryNav).getByRole("link", { name: /^investments$/i }),
    ).toHaveAttribute("href", "/investments");
    expect(
      within(primaryNav).getByRole("link", { name: /^transactions$/i }),
    ).toHaveAttribute("href", "/transactions");
    expect(screen.getAllByText(/account: demo/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^pm$/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /logout/i })).toHaveLength(1);
    expect(
      screen.getAllByRole("switch", { name: /theme mode/i })[0],
    ).toHaveAccessibleName(/theme mode/i);
    expect(screen.queryByText(/terminal view/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "1D" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "1M" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "YTD" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ALL" })).not.toBeInTheDocument();
  });

  test("uses the saved light theme on auth pages", async () => {
    localStorage.setItem("portfolio_theme", "light");
    window.history.pushState({}, "", "/login");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /sign in to your portfolio/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("auth-shell")).toHaveAttribute(
      "data-theme",
      "light",
    );

    cleanup();
    localStorage.setItem("portfolio_theme", "light");
    window.history.pushState({}, "", "/register");
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("auth-shell")).toHaveAttribute(
      "data-theme",
      "light",
    );
  });

  test("theme toggle switches between dark and light modes", async () => {
    const user = userEvent.setup();
    localStorage.setItem("portfolio_token", "test-token");

    render(<App />);

    const appShell = await screen.findByTestId("app-shell");
    expect(appShell).toHaveAttribute("data-theme", "dark");

    await user.click(screen.getAllByRole("switch", { name: /theme mode/i })[0]);

    expect(appShell).toHaveAttribute("data-theme", "light");
    expect(
      screen.getAllByRole("switch", { name: /theme mode/i })[0],
    ).toHaveAttribute("aria-checked", "true");
  });

  test("keeps the selected theme after logout and the next authenticated render", async () => {
    const user = userEvent.setup();
    localStorage.setItem("portfolio_token", "test-token");

    render(<App />);

    const appShell = await screen.findByTestId("app-shell");
    await user.click(screen.getAllByRole("switch", { name: /theme mode/i })[0]);
    expect(appShell).toHaveAttribute("data-theme", "light");

    await user.click(screen.getByRole("button", { name: /logout/i }));
    expect(localStorage.getItem("portfolio_theme")).toBe("light");

    cleanup();
    localStorage.setItem("portfolio_token", "test-token");
    window.history.pushState({}, "", "/dashboard");
    render(<App />);

    expect(await screen.findByTestId("app-shell")).toHaveAttribute(
      "data-theme",
      "light",
    );
  });

  test("loads dashboard summary metrics and asset allocation", async () => {
    localStorage.setItem("portfolio_token", "test-token");
    apiClientMock.get.mockResolvedValueOnce({
      data: {
        total_current_value: "1500.00",
        total_cost_basis: "1000.00",
        total_gain_loss: "500.00",
        total_performance_percentage: "50.00",
        asset_type_summary: [
          {
            asset_type: "STOCK",
            current_value: "1500.00",
            cost_basis: "1000.00",
            gain_loss: "500.00",
          },
        ],
      },
    });

    render(<App />);

    expect((await screen.findAllByText("$1,500.00")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("$1,000.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$500.00").length).toBeGreaterThan(0);
    expect(screen.getByText("50.00%")).toBeInTheDocument();
    expect(screen.getByText(/performance path/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/portfolio performance chart/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/chart placeholder/i)).not.toBeInTheDocument();
    expect(screen.getByText("Stocks")).toBeInTheDocument();
    expect(apiClientMock.get).toHaveBeenCalledWith("/dashboard/summary");
  });

  test("creates and deletes investments with confirmation feedback", async () => {
    const user = userEvent.setup();
    localStorage.setItem("portfolio_token", "test-token");
    window.history.pushState({}, "", "/investments");
    const appleHolding = {
      id: "investment-1",
      name: "Apple Inc.",
      symbol: "AAPL",
      asset_type: "STOCK",
      current_price: "200.00",
      current_quantity: "5.000000",
      average_buy_price: "150.00",
      estimated_cost_basis: "750.00",
      current_value: "1000.00",
      gain_loss: "250.00",
      performance_percentage: "33.33",
    };
    apiClientMock.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [appleHolding] })
      .mockResolvedValueOnce({ data: [] });
    apiClientMock.post.mockResolvedValueOnce({ data: appleHolding });
    apiClientMock.delete.mockResolvedValueOnce({
      data: { message: "Investment deleted" },
    });

    render(<App />);

    expect(await screen.findByText(/no holdings available/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /add investment/i }));
    const investmentDialog = screen.getByRole("dialog", {
      name: /create investment with opening buy/i,
    });
    expect(investmentDialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByLabelText(/transaction date/i)).toHaveValue(
      new Date().toISOString().slice(0, 10),
    );
    await user.type(screen.getByLabelText(/^name$/i), "Apple Inc.");
    await user.type(screen.getByLabelText(/^symbol$/i), "aapl");
    await user.selectOptions(screen.getByLabelText(/asset type/i), "STOCK");
    await user.type(screen.getByLabelText(/current price/i), "200");
    await user.type(screen.getByLabelText(/initial quantity/i), "5");
    await user.type(screen.getByLabelText(/initial purchase price/i), "150");
    fireEvent.change(screen.getByLabelText(/transaction date/i), {
      target: { value: "275760-05-01" },
    });
    expect(screen.getByLabelText(/transaction date/i)).toHaveValue("2757-05-01");
    await user.click(screen.getByRole("button", { name: /^save investment$/i }));

    await waitFor(() =>
      expect(apiClientMock.post).toHaveBeenCalledWith("/investments", {
        asset_type: "STOCK",
        current_price: "200",
        initial_purchase_price: "150",
        initial_quantity: "5",
        name: "Apple Inc.",
        symbol: "aapl",
        transaction_date: "2757-05-01",
      }),
    );
    expect(await screen.findByText(/investment saved/i)).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete apple inc\./i }));
    expect(
      screen.getByRole("dialog", { name: /delete investment/i }),
    ).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByText(/Deleting Apple Inc\. will also delete related transaction history\./i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^confirm delete$/i }));

    await waitFor(() =>
      expect(apiClientMock.delete).toHaveBeenCalledWith(
        "/investments/investment-1",
      ),
    );
    expect(
      await screen.findByRole("dialog", { name: /investment deleted/i }),
    ).toHaveAttribute("aria-modal", "true");
  });

  test("edits investments without transaction-source fields", async () => {
    const user = userEvent.setup();
    localStorage.setItem("portfolio_token", "test-token");
    window.history.pushState({}, "", "/investments");
    const appleHolding = {
      id: "investment-1",
      name: "Apple Inc.",
      symbol: "AAPL",
      asset_type: "STOCK",
      current_price: "200.00",
      current_quantity: "5.000000",
      average_buy_price: "150.00",
      estimated_cost_basis: "750.00",
      current_value: "1000.00",
      gain_loss: "250.00",
      performance_percentage: "33.33",
    };
    apiClientMock.get
      .mockResolvedValueOnce({ data: [appleHolding] })
      .mockResolvedValueOnce({
        data: [{ ...appleHolding, name: "Apple", current_price: "205.00" }],
      });
    apiClientMock.put.mockResolvedValueOnce({
      data: { ...appleHolding, name: "Apple", current_price: "205.00" },
    });

    render(<App />);

    await user.click(await screen.findByRole("button", { name: /edit apple inc\./i }));
    expect(screen.queryByLabelText(/initial quantity/i)).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText(/^name$/i));
    await user.type(screen.getByLabelText(/^name$/i), "Apple");
    await user.clear(screen.getByLabelText(/current price/i));
    await user.type(screen.getByLabelText(/current price/i), "205");
    await user.click(screen.getByRole("button", { name: /^save investment$/i }));

    await waitFor(() =>
      expect(apiClientMock.put).toHaveBeenCalledWith("/investments/investment-1", {
        asset_type: "STOCK",
        current_price: "205",
        name: "Apple",
        symbol: "AAPL",
      }),
    );
  });

  test("creates transactions and surfaces sell validation errors", async () => {
    const user = userEvent.setup();
    localStorage.setItem("portfolio_token", "test-token");
    window.history.pushState({}, "", "/transactions");
    const appleHolding = {
      id: "investment-1",
      name: "Apple Inc.",
      symbol: "AAPL",
      asset_type: "STOCK",
      current_price: "200.00",
      current_quantity: "5.000000",
      average_buy_price: "150.00",
      estimated_cost_basis: "750.00",
      current_value: "1000.00",
      gain_loss: "250.00",
      performance_percentage: "33.33",
    };
    const buyTransaction = {
      id: "transaction-1",
      investment_id: "investment-1",
      investment_symbol: "AAPL",
      transaction_type: "BUY",
      quantity: "5.000000",
      price: "150.00",
      transaction_date: "2026-05-01",
    };
    apiClientMock.get
      .mockResolvedValueOnce({ data: [buyTransaction] })
      .mockResolvedValueOnce({ data: [appleHolding] })
      .mockResolvedValueOnce({ data: [buyTransaction] })
      .mockResolvedValueOnce({ data: [appleHolding] });
    apiClientMock.post
      .mockResolvedValueOnce({ data: buyTransaction })
      .mockRejectedValueOnce({
        response: {
          data: {
            detail: "Transaction would make quantity negative for this investment",
          },
        },
      });

    render(<App />);

    expect(await screen.findByText("AAPL")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /add transaction/i }));
    expect(
      screen.getByRole("dialog", { name: /add buy or sell transaction/i }),
    ).toHaveAttribute("aria-modal", "true");
    expect(screen.getByLabelText(/transaction date/i)).toHaveValue(
      new Date().toISOString().slice(0, 10),
    );
    await user.selectOptions(screen.getByLabelText(/^investment$/i), "investment-1");
    await user.selectOptions(screen.getByLabelText(/transaction type/i), "BUY");
    await user.type(screen.getByLabelText(/^quantity$/i), "5");
    await user.type(screen.getByLabelText(/^price$/i), "150");
    fireEvent.change(screen.getByLabelText(/transaction date/i), {
      target: { value: "2026-05-01" },
    });
    await user.click(screen.getByRole("button", { name: /^save transaction$/i }));

    await waitFor(() =>
      expect(apiClientMock.post).toHaveBeenCalledWith("/transactions", {
        investment_id: "investment-1",
        price: "150",
        quantity: "5",
        transaction_date: "2026-05-01",
        transaction_type: "BUY",
      }),
    );
    expect(await screen.findByText(/transaction saved/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add transaction/i }));
    await user.selectOptions(screen.getByLabelText(/^investment$/i), "investment-1");
    await user.selectOptions(screen.getByLabelText(/transaction type/i), "SELL");
    await user.type(screen.getByLabelText(/^quantity$/i), "99");
    await user.type(screen.getByLabelText(/^price$/i), "150");
    fireEvent.change(screen.getByLabelText(/transaction date/i), {
      target: { value: "2026-05-02" },
    });
    await user.click(screen.getByRole("button", { name: /^save transaction$/i }));

    expect(
      await screen.findByText(/would make quantity negative/i),
    ).toBeInTheDocument();
  });

  test("deletes transactions only after confirmation", async () => {
    const user = userEvent.setup();
    localStorage.setItem("portfolio_token", "test-token");
    window.history.pushState({}, "", "/transactions");
    const buyTransaction = {
      id: "transaction-1",
      investment_id: "investment-1",
      investment_symbol: "AAPL",
      transaction_type: "BUY",
      quantity: "5.000000",
      price: "150.00",
      transaction_date: "2026-05-01",
    };
    apiClientMock.get
      .mockResolvedValueOnce({ data: [buyTransaction] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });
    apiClientMock.delete.mockResolvedValueOnce({
      data: { message: "Transaction deleted" },
    });

    render(<App />);

    await user.click(await screen.findByRole("button", { name: /delete buy aapl/i }));
    expect(
      screen.getByRole("dialog", { name: /delete transaction/i }),
    ).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText(/delete this transaction/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^confirm delete$/i }));

    await waitFor(() =>
      expect(apiClientMock.delete).toHaveBeenCalledWith(
        "/transactions/transaction-1",
      ),
    );
    expect(
      await screen.findByRole("dialog", { name: /transaction deleted/i }),
    ).toHaveAttribute("aria-modal", "true");
  });
});
