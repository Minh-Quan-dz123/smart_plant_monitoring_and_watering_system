package com.example.project_iot_auto_watering.ui.home

import android.app.Dialog
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.DialogFragment
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.databinding.DialogAddCropsBinding

import com.google.android.material.dialog.MaterialAlertDialogBuilder

class FragmentDialogAdd(val listener: ClickAddCrops) : DialogFragment(), View.OnClickListener {

    private var _binding: DialogAddCropsBinding? = null
    private val binding get() = _binding!!

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        _binding = DialogAddCropsBinding.inflate(layoutInflater)

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
        binding.btnOk.setOnClickListener(this)
        binding.btnCancel.setOnClickListener(this)
    }

    override fun onClick(p0: View?) {
        when (p0?.id) {
            R.id.btn_ok -> {
                val nameCrops = binding.edtInput.text.toString()
                if (nameCrops != "") {
                    listener.addCrops(nameCrops,-1)
                    dismiss()
                }
            }

            R.id.btn_cancel -> {
                dismiss()
            }
        }
    }
}

interface ClickAddCrops {
    fun addCrops(nameCrops: String,id:Int)
}