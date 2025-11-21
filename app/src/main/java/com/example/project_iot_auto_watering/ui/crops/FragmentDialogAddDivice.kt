package com.example.project_iot_auto_watering.ui.home.adapter

import android.app.Dialog
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.DialogFragment
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.databinding.DialogAddDeviceBinding
import com.google.android.material.dialog.MaterialAlertDialogBuilder

class FragmentDialogAddDevice(private val listener: AddDevice) : DialogFragment(), View.OnClickListener {

    private var _binding: DialogAddDeviceBinding? = null
    private val binding get() = _binding!!

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        _binding = DialogAddDeviceBinding.inflate(layoutInflater)

        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setView(binding.root)
            .create()

        dialog.window?.setLayout(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )

        initListener()

        return dialog
    }

    private fun initListener() {
        binding.btnCancel.setOnClickListener(this)
        binding.btnOk.setOnClickListener(this)
    }

    override fun onClick(p0: View?) {
        when (p0?.id) {
            R.id.btn_ok -> {
                val idDevice = binding.edtInput.text.toString()
                if (idDevice != "-1" && idDevice != "") {
                    listener.getIdDevice(idDevice)
                    dismiss()
                } else {
                    Toast.makeText(
                        requireContext(),
                        "Vui lòng nhập id thiết bị",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }

            R.id.btn_cancel -> {
                dismiss()
            }
        }
    }
}
interface AddDevice{
    fun getIdDevice(id:String)
}