import Swal from "sweetalert2";
import "../styles/swal-custom.css";

export const showAlert = (
  type: "success" | "error" | "warning",
  title: string,
  text: string,
  timer?: number
) => {
  const config: {
    icon: "success" | "error" | "warning";
    title: string;
    text: string;
    confirmButtonColor: string;
    customClass: {
      popup: string;
      title: string;
      htmlContainer: string;
    };
    timer?: number;
    showConfirmButton?: boolean;
  } = {
    icon: type,
    title,
    text,
    confirmButtonColor: "#268bd2",
    customClass: {
      popup: "swal-solarized",
      title: "swal-title",
      htmlContainer: "swal-text",
    },
  };

  if (timer) {
    config.timer = timer;
    config.showConfirmButton = false;
  }

  return Swal.fire(config);
};

export const showConfirmDialog = async (title: string, text: string) => {
  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc322f",
    cancelButtonColor: "#268bd2",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    customClass: {
      popup: "swal-solarized",
      title: "swal-title",
      htmlContainer: "swal-text",
    },
  });
};

export const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || fallbackMessage;
  }
  return fallbackMessage;
};
